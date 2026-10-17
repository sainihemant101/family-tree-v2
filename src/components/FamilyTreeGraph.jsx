import React, { useMemo, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useGesture } from '@use-gesture/react';
import useStore from '../store';

let measureCtx = null;
const getTextWidth = (text) => {
  if (typeof document === 'undefined') return text.length * 8; 
  if (!measureCtx) {
    const canvas = document.createElement('canvas');
    measureCtx = canvas.getContext('2d');
  }
  measureCtx.font = 'bold 12px Sans-Serif';
  return measureCtx.measureText(text).width;
};

export default function FamilyTreeGraph({ onNodeClick }) {
  const members = useStore(state => state.members);
  const unions = useStore(state => state.unions);
  const fgRef = useRef();
  const containerRef = useRef();

  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];

    // Valid member lookup set
    const validIds = new Set(members.filter(m => !m.isDeleted).map(m => m.id));

    members.forEach(m => {
      if (!m.isDeleted) {
        const label = (m.first_name || 'Unknown').split(' ')[0];
        const textWidth = getTextWidth(label);
        const size = Math.max(45, textWidth + 24);
        nodes.push({ ...m, type: 'person', nodeSize: size, shortName: label });
      }
    });

    unions.forEach(u => {
      // ONLY add union and its links if ALL referenced nodes exist in validIds
      const pAValid = !u.partner_a_id || validIds.has(u.partner_a_id);
      const pBValid = !u.partner_b_id || validIds.has(u.partner_b_id);

      if (pAValid && pBValid) {
        nodes.push({ id: u.id, type: 'union', nodeSize: 10 });
        if (u.partner_a_id && validIds.has(u.partner_a_id)) {
          links.push({ source: u.partner_a_id, target: u.id });
        }
        if (u.partner_b_id && validIds.has(u.partner_b_id)) {
          links.push({ source: u.partner_b_id, target: u.id });
        }
        if (u.children_ids) {
          u.children_ids.forEach(childId => {
            if (validIds.has(childId)) {
              links.push({ source: u.id, target: childId });
            }
          });
        }
      }
    });

    return { nodes, links };
  }, [members, unions]);

  useGesture({
    onDrag: ({ delta: [dx, dy] }) => {
      if (!fgRef.current) return;
      const currentCenter = fgRef.current.centerAt();
      const currentZoom = fgRef.current.zoom();
      fgRef.current.centerAt(
        currentCenter.x - dx / currentZoom,
        currentCenter.y - dy / currentZoom,
        0 
      );
    },
    onPinch: ({ delta: [d] }) => {
      if (!fgRef.current) return;
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom * (1 + d * 0.01), 0);
    }
  }, {
    target: containerRef,
    eventOptions: { passive: false }
  });

  const handleEngineTick = () => {
    if (!graphData || !graphData.nodes) return;

    unions.forEach(u => {
      const uNode = graphData.nodes.find(n => n.id === u.id);
      const pA = graphData.nodes.find(n => n.id === u.partner_a_id);
      const pB = graphData.nodes.find(n => n.id === u.partner_b_id);

      if (uNode && pA && pB) {
        const male = pA.gender === 'male' ? pA : (pB.gender === 'male' ? pB : pA);
        const female = male === pA ? pB : pA;

        male.y = uNode.y;
        female.y = uNode.y;
        male.vy = 0;
        female.vy = 0;

        const maleOffset = (male.nodeSize / 2) + 20;
        const femaleOffset = (female.nodeSize / 2) + 20;

        male.x = uNode.x - maleOffset;
        female.x = uNode.x + femaleOffset;
        male.vx = 0;
        female.vx = 0;
      }
    });
  };

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(node => {
        if (node.type === 'union') return -300;
        return -(node.nodeSize * 15);
      }); 
      fgRef.current.d3Force('link').distance(100);     
    }
  }, [graphData]);

  const paintNode = (node, ctx, globalScale) => {
    if (node.type === 'union') {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#9ca3af'; 
      ctx.fill();
      return;
    }

    const size = node.nodeSize || 45;
    ctx.fillStyle = node.gender === 'male' ? '#3b82f6' : '#ef4444'; 

    if (node.gender === 'male') {
      ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size); 
    } else {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size / 2, 0, 2 * Math.PI, false); 
      ctx.fill();
    }

    const shortName = node.shortName || 'Unknown';
    const fontSize = Math.min(12, 10 + globalScale); 
    
    ctx.font = `bold ${fontSize}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(shortName, node.x, node.y);
  };

  return (
    <div ref={containerRef} className="w-full h-full touch-none cursor-grab active:cursor-grabbing">
      {/* Adding a dynamic key forces a clean component remount, clearing any cached ghost links */}
      <ForceGraph2D
        key={`graph-${graphData.nodes.length}-${graphData.links.length}`}
        ref={fgRef}
        graphData={graphData}
        nodeCanvasObject={paintNode}
        onEngineTick={handleEngineTick}
        dagMode="td" 
        dagLevelDistance={100} 
        enableZoomPanInteraction={false} 
        onNodeClick={(node) => {
          if (node.type !== 'union' && onNodeClick) {
            onNodeClick(node);
          }
        }}
      />
    </div>
  );
}