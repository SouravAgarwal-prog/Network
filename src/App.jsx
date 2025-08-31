import React, { useState, useRef, useEffect } from 'react';

class Edge {
    constructor(to, rev, cap) {
        this.to = to;
        this.rev = rev;
        this.cap = cap;
        this.originalCap = cap;
        this.flow = 0;
    }
}

class Dinic {
    constructor(n) {
        this.n = n;
        this.graph = Array.from({ length: n }, () => []);
        this.level = new Array(n).fill(-1);
        this.ptr = new Array(n).fill(0);
    }

    addEdge(u, v, cap) {
        let a = new Edge(v, this.graph[v].length, cap);
        let b = new Edge(u, this.graph[u].length, 0);
        this.graph[u].push(a);
        this.graph[v].push(b);
    }

    bfs(s, t) {
        this.level.fill(-1);
        let q = [s];
        this.level[s] = 0;
        while (q.length) {
            let u = q.shift();
            for (let e of this.graph[u]) {
                if (e.cap > 0 && this.level[e.to] === -1) {
                    this.level[e.to] = this.level[u] + 1;
                    q.push(e.to);
                }
            }
        }
        return this.level[t] !== -1;
    }

    dfs(u, t, pushed) {
        if (pushed === 0) return 0;
        if (u === t) return pushed;
        for (; this.ptr[u] < this.graph[u].length; this.ptr[u]++) {
            let e = this.graph[u][this.ptr[u]];
            if (this.level[e.to] === this.level[u] + 1 && e.cap > 0) {
                let tr = this.dfs(e.to, t, Math.min(pushed, e.cap));
                if (tr > 0) {
                    e.cap -= tr;
                    this.graph[e.to][e.rev].cap += tr;
                    e.flow += tr;
                    this.graph[e.to][e.rev].flow -= tr; 
                    return tr;
                }
            }
        }
        return 0;
    }

    maxFlow(s, t) {
        let flow = 0;
        while (this.bfs(s, t)) {
            this.ptr.fill(0);
            let pushed;
            while ((pushed = this.dfs(s, t, Infinity)) > 0) {
                flow += pushed;
            }
        }
        return flow;
    }
}

export default function MaxFlowVisualizer() {
    const [n, setN] = useState('');
    const [matrix, setMatrix] = useState([]);
    const [graphData, setGraphData] = useState(null);
    const [flow, setFlow] = useState(null);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(1);
    const [newCap, setNewCap] = useState('');
    const canvasRef = useRef();

    const handleNChange = (e) => {
        const value = parseInt(e.target.value);
        setN(value);
        setMatrix(Array.from({ length: value }, () => Array(value).fill('')));
        setGraphData(null);
        setFlow(null);
    };

    const handleMatrixChange = (i, j, value) => {
        const newMatrix = [...matrix];
        newMatrix[i][j] = value;
        setMatrix(newMatrix);
    };

    const updateEdge = (u, v, cap) => {
        if (isNaN(cap) || u === v || u < 0 || v < 0 || u >= n || v >= n) return;
        const newMatrix = [...matrix];
        newMatrix[u][v] = cap.toString();
        setMatrix(newMatrix);
        setTimeout(() => calculateMaxFlow(), 0);
    };

    const calculateMaxFlow = () => {
        const dinic = new Dinic(n);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const cap = parseInt(matrix[i][j]);
                if (!isNaN(cap) && cap > 0) {
                    dinic.addEdge(i, j, cap);
                }
            }
        }
        const result = dinic.maxFlow(0, n - 1);
        setFlow(result);
        setGraphData({ edges: dinic.graph });
    };

    const drawGraph = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const radius = 20;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const angleStep = (2 * Math.PI) / n;
        const positions = [];

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < n; i++) {
            const angle = i * angleStep;
            const x = centerX + 200 * Math.cos(angle);
            const y = centerY + 200 * Math.sin(angle);
            positions.push({ x, y });
        }

        if (graphData) {
            graphData.edges.forEach((edges, u) => {
                edges.forEach((e) => {
                    if (e.originalCap === 0) return; // ✅ skip residual edges
                    const v = e.to;
                    const { x: x1, y: y1 } = positions[u];
                    const { x: x2, y: y2 } = positions[v];
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const normX = dx / len;
                    const normY = dy / len;
                    const startX = x1 + normX * radius;
                    const startY = y1 + normY * radius;
                    const endX = x2 - normX * radius;
                    const endY = y2 - normY * radius;

                    const isSaturated = e.flow === e.originalCap;
                    ctx.strokeStyle = isSaturated ? 'red' : e.flow > 0 ? 'green' : 'gray';
                    ctx.lineWidth = isSaturated ? 4 : e.flow > 0 ? 3 : 1;

                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();

                    const arrowLength = 10;
                    const arrowWidth = 6;
                    ctx.beginPath();
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(
                        endX - normX * arrowLength - normY * arrowWidth / 2,
                        endY - normY * arrowLength + normX * arrowWidth / 2
                    );
                    ctx.lineTo(
                        endX - normX * arrowLength + normY * arrowWidth / 2,
                        endY - normY * arrowLength - normX * arrowWidth / 2
                    );
                    ctx.closePath();
                    ctx.fillStyle = ctx.strokeStyle;
                    ctx.fill();

                    const midX = (startX + endX) / 2;
                    const midY = (startY + endY) / 2;
                    ctx.fillStyle = 'black';
                    ctx.font = '14px Arial';
                    ctx.fillText(`${e.flow}/${e.originalCap}`, midX, midY - 5);
                });
            });
        }

        for (let i = 0; i < n; i++) {
            const { x, y } = positions[i];
            const img = new Image();
            img.src = 'https://m.media-amazon.com/images/I/41gQQAA8ozL.jpg'; // assuming placed in public folder
            img.onload = () => {
                ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);

                // Draw the node label (S, T, or index)
                ctx.fillStyle = 'black';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const label = i === 0 ? "S" : i === n - 1 ? "T" : i.toString();
                ctx.fillText(label, x, y + radius + 12); // text just below image
            };

            ctx.fillStyle = 'black';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const label = i === 0 ? "S" : i === n - 1 ? "T" : i.toString();
            ctx.fillText(label, x, y);
        }
    };

    useEffect(() => {
        if (graphData && n > 0) drawGraph();
    }, [graphData]);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h2>Router Flow Visualizer</h2>
            <label>Number of vertices: </label>
            <input type="number" value={n} onChange={handleNChange} min="2" />

            {matrix.length > 0 && (
                <>
                    <h3>Enter Capacity Matrix:</h3>
                    <table>
                        <tbody>
                            {matrix.map((row, i) => (
                                <tr key={i}>
                                    {row.map((cell, j) => (
                                        <td key={j}>
                                            <input
                                                type="number"
                                                value={cell}
                                                onChange={(e) =>
                                                    handleMatrixChange(i, j, e.target.value)
                                                }
                                                style={{ width: '60px' }}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <button
                        style={{ marginTop: '20px' }}
                        onClick={calculateMaxFlow}
                    >
                        Calculate Max Flow (S → T) & Draw Graph
                    </button>

                    <h3>Edit/Add Edge</h3>
                    <div style={{ marginBottom: '10px' }}>
                        <label>From: </label>
                        <select value={from} onChange={(e) => setFrom(parseInt(e.target.value))}>
                            {Array.from({ length: n }, (_, i) => (
                                <option key={i} value={i}>{i}</option>
                            ))}
                        </select>
                        <label style={{ marginLeft: '10px' }}>To: </label>
                        <select value={to} onChange={(e) => setTo(parseInt(e.target.value))}>
                            {Array.from({ length: n }, (_, i) => (
                                <option key={i} value={i}>{i}</option>
                            ))}
                        </select>
                        <label style={{ marginLeft: '10px' }}>Capacity: </label>
                        <input
                            type="number"
                            value={newCap}
                            onChange={(e) => setNewCap(e.target.value)}
                            style={{ width: '60px' }}
                        />
                        <button
                            onClick={() => updateEdge(from, to, parseInt(newCap))}
                            style={{ marginLeft: '10px' }}
                        >
                            Update Edge
                        </button>
                    </div>
                </>
            )}

            {flow !== null && (
                <h3 style={{ color: 'green' }}>Maximum Flow = {flow}</h3>
            )}

            <canvas
                ref={canvasRef}
                width={600}
                height={600}
                style={{
                    border: '1px solid black',
                    marginTop: '30px',
                    backgroundColor: '#f9f9f9',
                }}
            ></canvas>
        </div>
    );
}
