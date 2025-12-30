import React, { useMemo, useState, useRef, useEffect } from 'react';
import ReactFlow, { 
    Background, 
    Controls, 
    MiniMap, 
    useNodesState, 
    useEdgesState, 
    Position,
    Node,
    Edge,
    Handle,
    NodeProps,
    ConnectionLineType,
    MarkerType,
    ReactFlowInstance
} from 'reactflow';
import dagre from 'dagre';
import { MindMapNode } from '../types';
import { Network, Pen, Download, Eraser, Trash2, X, Check, Palette, Image as ImageIcon, Maximize } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import html2canvas from 'html2canvas';

interface MindMapViewProps {
    data: MindMapNode;
}

// --- CUSTOM NODES ---

const CustomMindMapNode = ({ data, isConnectable }: NodeProps) => {
    return (
        <div className="px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900 border-2 border-black dark:border-white text-black dark:text-white min-w-[180px] max-w-[250px] text-center rounded-none relative">
            <Handle 
                type="target" 
                position={Position.Left} 
                isConnectable={isConnectable} 
                className="!bg-brand-yellow !w-3 !h-3 !border-2 !border-black dark:!border-white -ml-1.5" 
            />
            <div className="text-xs md:text-sm font-bold">
                <MarkdownRenderer content={data.label} inline />
            </div>
            <Handle 
                type="source" 
                position={Position.Right} 
                isConnectable={isConnectable} 
                className="!bg-brand-yellow !w-3 !h-3 !border-2 !border-black dark:!border-white -mr-1.5" 
            />
        </div>
    );
};

const RootMindMapNode = ({ data, isConnectable }: NodeProps) => {
    return (
        <div className="px-6 py-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-brand-yellow border-2 border-black text-black min-w-[200px] max-w-[300px] text-center rounded-none relative">
            <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="opacity-0" />
            <div className="text-lg font-bold uppercase tracking-wider">
                <MarkdownRenderer content={data.label} inline />
            </div>
            <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="!bg-black !w-4 !h-4 !border-2 !border-white -mr-2" />
        </div>
    );
};

const nodeTypes = {
    mindMapNode: CustomMindMapNode,
    rootNode: RootMindMapNode
};

// --- LAYOUT LOGIC ---

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Larger dimensions to prevent overlap
    const nodeWidth = 280;
    const nodeHeight = 100;

    dagreGraph.setGraph({ 
        rankdir: 'LR', 
        nodesep: 60, 
        ranksep: 120 
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        
        // Dagre gives center point, React Flow needs top-left
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
        
        node.targetPosition = Position.Left;
        node.sourcePosition = Position.Right;
        
        return node;
    });

    return { nodes, edges };
};

const transformData = (root: MindMapNode) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let idCounter = 0;

    const traverse = (node: MindMapNode, parentId?: string) => {
        const id = `node-${idCounter++}`;
        const isRoot = !parentId;

        nodes.push({
            id,
            data: { label: node.label },
            position: { x: 0, y: 0 },
            type: isRoot ? 'rootNode' : 'mindMapNode',
        });

        if (parentId) {
            edges.push({
                id: `edge-${parentId}-${id}`,
                source: parentId,
                target: id,
                type: 'smoothstep',
                animated: false, // Set to true if you want moving dots
                // Ensure stroke is visible in dark mode (white) and light mode (black)
                style: { strokeWidth: 2 },
                className: 'stroke-black dark:stroke-white',
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#FFE600', // Yellow arrow head
                },
            });
        }

        if (node.children) {
            node.children.forEach(child => traverse(child, id));
        }
    };

    traverse(root);
    return { nodes, edges };
};

const MindMapView: React.FC<MindMapViewProps> = ({ data }) => {
    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
         const raw = transformData(data);
         return getLayoutedElements(raw.nodes, raw.edges);
    }, [data]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    
    // React Flow Instance for FitView
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

    // --- ANNOTATION STATE ---
    const [isAnnotating, setIsAnnotating] = useState(false);
    const [drawColor, setDrawColor] = useState('#FFE600'); // Default Yellow
    const [drawWidth, setDrawWidth] = useState(4);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDrawing = useRef(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    // Colors available for annotation - RESTRICTED PALETTE
    const colors = [
        '#FFE600', // Yellow
        '#000000', // Black
        '#FFFFFF', // White
        '#A1A1AA', // Zinc 400 (Grey) for subtle marks
    ];

    // Setup Canvas Resolution
    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;
        
        const resizeCanvas = () => {
            if (containerRef.current && canvasRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                // Match resolution
                canvasRef.current.width = width;
                canvasRef.current.height = height;
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    // Drawing Logic
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isAnnotating || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        isDrawing.current = true;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = drawWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (!hasDrawn) setHasDrawn(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isAnnotating || !isDrawing.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isAnnotating || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.closePath();
        isDrawing.current = false;
    };

    const clearCanvas = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setHasDrawn(false);
    };

    const handleDownload = async () => {
        if (!containerRef.current) return;
        setIsDownloading(true);

        // Smart Logic:
        // If the user has NOT drawn anything, we assume they want the "Whole Map".
        // We auto-fit the view to ensure everything is visible.
        // If they HAVE drawn, we must respect the current viewport so drawings stay aligned.
        if (!hasDrawn && rfInstance) {
             await rfInstance.fitView({ padding: 0.1, duration: 200 });
             // Wait briefly for transition
             await new Promise(r => setTimeout(r, 300));
        }

        try {
            // Calculate accurate bounds to avoid clipping (common html2canvas issue with scroll)
            const rect = containerRef.current.getBoundingClientRect();
            
            const canvas = await html2canvas(containerRef.current, {
                useCORS: true,
                backgroundColor: null,
                // Explicitly set dimensions and position to capture the element exactly
                width: rect.width,
                height: rect.height,
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY,
                scale: 2, // High DPI
                ignoreElements: (element) => {
                     // Hide the UI controls from screenshot
                     return element.classList.contains('annotation-toolbar') || 
                            element.classList.contains('react-flow__controls') || 
                            element.classList.contains('react-flow__minimap') ||
                            element.classList.contains('mindmap-header');
                },
                logging: false
            });
            
            const link = document.createElement('a');
            link.download = `mindmap-${hasDrawn ? 'annotated' : 'full'}-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("Screenshot failed", err);
            alert("Failed to capture mind map.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div 
            ref={containerRef}
            className="w-full h-[600px] border-2 border-black dark:border-white bg-zinc-50 dark:bg-zinc-950 animate-in fade-in relative group overflow-hidden"
        >
             <div className="mindmap-header absolute top-4 left-4 z-10 pointer-events-none">
                <div className="flex items-center gap-3 bg-white dark:bg-black border-2 border-black dark:border-white p-3 pointer-events-auto shadow-lg">
                    <div className="p-2 bg-brand-yellow">
                        <Network className="w-5 h-5 text-black" />
                    </div>
                    <h2 className="font-bold uppercase text-black dark:text-white">Mind Map</h2>
                </div>
            </div>

            {/* --- ANNOTATION TOOLBAR --- */}
            <div className="annotation-toolbar absolute top-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-auto">
                {/* Main Toggle */}
                <div className="flex gap-2">
                    {/* Always show Download button */}
                    <button 
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="p-3 bg-white dark:bg-black border-2 border-black dark:border-white hover:bg-zinc-100 dark:hover:bg-zinc-900 shadow-lg text-black dark:text-white"
                        title={hasDrawn ? "Download Snapshot (with drawings)" : "Download Full Map"}
                    >
                        {isDownloading ? <div className="w-5 h-5 border-2 border-t-transparent border-black dark:border-white rounded-full animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                    </button>

                    {isAnnotating && (
                        <button 
                            onClick={clearCanvas}
                            className="p-3 bg-white dark:bg-black border-2 border-black dark:border-white hover:bg-zinc-100 dark:hover:bg-zinc-900 shadow-lg text-black dark:text-white"
                            title="Clear Annotations"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                    <button 
                        onClick={() => setIsAnnotating(!isAnnotating)}
                        className={`
                            p-3 border-2 shadow-lg transition-all flex items-center gap-2 font-bold uppercase
                            ${isAnnotating 
                                ? 'bg-brand-yellow border-black text-black' 
                                : 'bg-white dark:bg-black border-black dark:border-white text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                            }
                        `}
                    >
                        {isAnnotating ? (
                            <>
                                <Check className="w-5 h-5" /> Done
                            </>
                        ) : (
                            <>
                                <Pen className="w-5 h-5" /> Annotate
                            </>
                        )}
                    </button>
                </div>

                {/* Annotation Options */}
                {isAnnotating && (
                    <div className="animate-in fade-in slide-in-from-right-4 bg-white dark:bg-black border-2 border-black dark:border-white p-4 shadow-xl flex flex-col gap-4 w-64">
                        {/* Colors */}
                        <div>
                            <label className="text-xs font-bold uppercase text-zinc-500 mb-2 block">Color</label>
                            <div className="grid grid-cols-4 gap-2">
                                {colors.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setDrawColor(c)}
                                        className={`w-6 h-6 rounded-full border-2 ${drawColor === c ? 'border-brand-yellow scale-125' : 'border-zinc-300 dark:border-zinc-700'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Width */}
                        <div>
                             <label className="text-xs font-bold uppercase text-zinc-500 mb-2 block">Line Width</label>
                             <div className="flex items-center gap-3">
                                 <button onClick={() => setDrawWidth(2)} className={`p-2 border-2 ${drawWidth === 2 ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-transparent border-zinc-200'}`}>
                                     <div className="w-4 h-0.5 bg-current"></div>
                                 </button>
                                 <button onClick={() => setDrawWidth(4)} className={`p-2 border-2 ${drawWidth === 4 ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-transparent border-zinc-200'}`}>
                                     <div className="w-4 h-1 bg-current"></div>
                                 </button>
                                 <button onClick={() => setDrawWidth(8)} className={`p-2 border-2 ${drawWidth === 8 ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-transparent border-zinc-200'}`}>
                                     <div className="w-4 h-2 bg-current"></div>
                                 </button>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- ANNOTATION CANVAS LAYER --- */}
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className={`absolute inset-0 z-40 transition-opacity duration-200 ${isAnnotating ? 'pointer-events-auto cursor-crosshair opacity-100' : 'pointer-events-none opacity-50'}`}
            />
            
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onInit={setRfInstance}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                minZoom={0.1}
                maxZoom={2}
                panOnDrag={!isAnnotating} // Lock panning when annotating
                zoomOnScroll={!isAnnotating} // Lock zooming when annotating
                nodesDraggable={!isAnnotating} // Lock node drag when annotating
            >
                <Controls 
                    showInteractive={false} 
                    className="
                        border-2 border-black shadow-lg 
                        bg-white dark:bg-black 
                        [&>button]:!bg-white dark:[&>button]:!bg-black 
                        [&>button]:!border-black dark:[&>button]:!border-white
                        [&_svg]:!fill-black dark:[&_svg]:!fill-white
                        text-black dark:text-white
                    " 
                />
                <Background gap={24} size={1} color="#888" className="opacity-20" />
                <MiniMap 
                    nodeColor={(n) => {
                        return n.type === 'rootNode' ? '#FFE600' : '#888';
                    }}
                    maskColor={"rgba(0,0,0,0.1)"}
                    className="border-2 border-black dark:border-white bg-white dark:bg-black"
                />
            </ReactFlow>
        </div>
    );
};

export default MindMapView;