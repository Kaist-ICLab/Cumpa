// import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";

export async function renderMermaid(code) {
  console.log('Rendering Mermaid diagram...');
  try {
    const response = await fetch('http://localhost:8000/mermaid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    // Clone response
    response.clone().json().then(result => {
      console.log('Mermaid response:', result);
    });
    
    const result = await response.json();
    if (result.status !== 'success') {
        console.error('Error generating Mermaid diagram:', result.message);
        return;
    }
    const mermaidText = result.diagram;
    const diagramElement = document.getElementById('diagram');
    
    // Render Mermaid diagram
    const { svg } = await mermaid.render('mermaid-unique-id', mermaidText);
    
    diagramElement.innerHTML = svg;
      
    // Add IDs to nodes based on their labels
    diagramElement.querySelectorAll('g.node').forEach((nodeGroup) => {
      const label = nodeGroup.querySelector('text')?.textContent;
      if (label) {
        nodeGroup.setAttribute('id', label); // label과 동일하게 id 설정
      }
    });

    console.log("Mermaid text:", mermaidText);
  } catch (error) {
      console.error('Failed to fetch Mermaid diagram:', error);
  }
}

export function highlightNode(nodeId) {
    const nodeEl = document.getElementById(nodeId);
    if (!nodeEl) return;
    nodeEl.style.transition = "fill 0.3s";
    nodeEl.style.fill = "yellow"; // Highlight color
    setTimeout(() => {
        nodeEl.style.fill = ""; // Reset color after highlight
    }, 500); // Highlight for 0.5 second
}