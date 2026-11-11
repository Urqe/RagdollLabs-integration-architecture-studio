import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import ReactFlow,{Background,Controls,MiniMap,MarkerType,applyNodeChanges,type Node,type Edge,type NodeChange,type Connection,type OnSelectionChangeParams} from '@xyflow/react';
import {Bot,Boxes,Download,FileUp,GitBranchPlus,Plus,RotateCcw,ShieldCheck,Trash2} from 'lucide-react';
import {ComponentKind,InterfaceKind,newId,parseProject,removeComponent,removeInterface,sampleProject,updateComponent,updateInterface,type ArchitectureInterface,type Component,type Project,type ViewMode} from './model';
import {loadProject,saveProject,exportProject,importProject} from './storage';
import {validateProject} from './validation';

const kindNames:Record<Component['kind'],string>={system:'System',ipaas:'iPaaS',gateway:'Tool gateway',agent:'AI agent',external:'External service'};
const emptyInterface=(sourceId:string,targetId:string,kind:ArchitectureInterface['kind']):ArchitectureInterface=>({
  id:newId('interface'),name:'New interface',kind,sourceId,targetId,
  protocol:'',authentication:'',authorization:'',contract:'',owner:'',description:'',
  idempotency:'unknown',observability:'unknown',enforcement:'unknown',access:'unknown'
});
function summarizeModel(p:Project):string {
  return '# '+p.name+'\n\n'+p.description+'\n\n## Components\n'+p.components.map(c=>'- '+c.name+' ('+kindNames[c.kind]+'): '+c.description).join('\n')+
  '\n\n## Interfaces\n'+p.interfaces.map(e=>'- **'+e.name+'**: '+p.components.find(c=>c.id===e.sourceId)?.name+' → '+p.components.find(c=>c.id===e.targetId)?.name+' | '+e.protocol+' | '+e.kind+' | owner: '+(e.owner||'Unknown')).join('\n')+
  '\n\n## Validation findings\n'+validateProject(p).map(f=>'- ['+f.severity+'] '+f.interfaceId+': '+f.message).join('\n')+'\n';
}
function downloadText(name:string,text:string,type:string):void {
  const url=URL.createObjectURL(new Blob([text],{type}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function App(){
  const [project,setProject]=useState<Project>(loadProject);
  const [mode,setMode]=useState<ViewMode>('integration');
  const [selected,setSelected]=useState<{type:'component'|'interface';id:string}|null>(null);
  const [error,setError]=useState('');
  const fileRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{try{saveProject(project);setError('');}catch(e){setError(e instanceof Error?e.message:'Unable to save project.');}},[project]);
  const findings=useMemo(()=>validateProject(project),[project]);
  const visibleIds=useMemo(()=>new Set(project.components.filter(c=>mode==='integration'?c.kind!=='agent':true).map(c=>c.id)),[project,mode]);
  const nodes:Node[]=useMemo(()=>project.components.filter(c=>visibleIds.has(c.id)).map(c=>({
    id:c.id,position:{x:c.x,y:c.y},data:{label:<div className="node-content"><span className="node-kind">{kindNames[c.kind]}</span><strong>{c.name}</strong><small>{c.description}</small></div>},
    className:'architecture-node node-'+c.kind,selected:selected?.type==='component'&&selected.id===c.id
  })),[project,visibleIds,selected]);
  const edges:Edge[]=useMemo(()=>project.interfaces.filter(e=>visibleIds.has(e.sourceId)&&visibleIds.has(e.targetId)&&(mode==='ai'||e.kind==='integration')).map(e=>({
    id:e.id,source:e.sourceId,target:e.targetId,label:e.name,type:'smoothstep',animated:e.kind==='tool',
    markerEnd:{type:MarkerType.ArrowClosed},className:e.kind==='tool'?'edge-tool':'edge-integration',
    selected:selected?.type==='interface'&&selected.id===e.id
  })),[project,visibleIds,mode,selected]);
  const onNodesChange=useCallback((changes:NodeChange[])=>{
    // applyNodeChanges normalizes position deltas; we persist only resulting coordinates.
    setProject(prev=>{
      const current:Node[]=prev.components.map(c=>({id:c.id,position:{x:c.x,y:c.y},data:{}}));
      const next=applyNodeChanges(changes,current);
      const positions=new Map(next.map(n=>[n.id,n.position]));
      return {...prev,components:prev.components.map(c=>{const pos=positions.get(c.id);return pos?{...c,x:pos.x,y:pos.y}:c;})};
    });
  },[]);
  const connect=useCallback((connection:Connection)=>{
    if(!connection.source||!connection.target||connection.source===connection.target)return;
    const kind=mode==='ai'?'tool':'integration';
    setProject(prev=>({...prev,interfaces:[...prev.interfaces,emptyInterface(connection.source!,connection.target!,kind)]}));
  },[mode]);
  const selection=useCallback((params:OnSelectionChangeParams)=>{
    if(params.nodes[0])setSelected({type:'component',id:params.nodes[0].id});
    else if(params.edges[0])setSelected({type:'interface',id:params.edges[0].id});
  },[]);
  const selectedComponent=selected?.type==='component'?project.components.find(c=>c.id===selected.id):undefined;
  const selectedInterface=selected?.type==='interface'?project.interfaces.find(e=>e.id===selected.id):undefined;
  const setComponent=(patch:Partial<Component>)=>{if(selectedComponent)setProject(p=>updateComponent(p,selectedComponent.id,patch));};
  const setInterface=(patch:Partial<ArchitectureInterface>)=>{if(selectedInterface)setProject(p=>updateInterface(p,selectedInterface.id,patch));};
  const addComponent=(kind:Component['kind'])=>{
    const item:Component={id:newId('component'),name:'New '+kindNames[kind],description:'',kind,x:100+project.components.length*45,y:160+project.components.length*30};
    setProject(p=>({...p,components:[...p.components,item]}));setSelected({type:'component',id:item.id});
  };
  const removeSelected=()=>{
    if(!selected)return;
    setProject(p=>selected.type==='component'?removeComponent(p,selected.id):removeInterface(p,selected.id));
    setSelected(null);
  };
  const handleImport=async(file?:File)=>{
    if(!file)return;
    try{const imported=await importProject(file);setProject(imported);setSelected(null);setError('');}
    catch(e){setError('Import failed: '+(e instanceof Error?e.message:'Invalid file'));}
  };
  const reset=()=>{if(window.confirm('Replace this project with the example? Your current local changes will be lost.')){setProject(sampleProject());setSelected(null);}};
  const exportMarkdown=()=>downloadText('architecture-report.md',summarizeModel(project),'text/markdown');
  const exportSVG=()=>{
    const root=document.querySelector('.react-flow__viewport') as SVGGElement|null;
    // XYFlow renders nodes as HTML; exporting viewport SVG alone would omit them.
    // Explicitly avoid suggesting this is a complete diagram export.
    if(!root){setError('Graph not available.');return;}
    exportMarkdown();
  };
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark">R<span>·</span></div><div><strong>RagDollLabs</strong><span>Integration Architecture Studio <em>0.1</em></span></div></div>
      <div className="top-actions"><button onClick={()=>fileRef.current?.click()}><FileUp size={16}/> Import</button><input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={e=>{void handleImport(e.target.files?.[0]);e.target.value='';}}/>
        <button onClick={()=>exportProject(project)}><Download size={16}/> JSON</button><button onClick={exportMarkdown}><Download size={16}/> Report</button><button className="ghost" onClick={reset} title="Restore example"><RotateCcw size={16}/></button>
      </div></header>
    <div className="workspace">
      <aside className="sidebar"><div className="section-caption">PROJECT</div><input aria-label="Project name" className="project-title" value={project.name} onChange={e=>setProject(p=>({...p,name:e.target.value||'Untitled'}))}/>
        <p className="muted">{project.description}</p><div className="section-caption">VIEWS</div>
        <button className={'nav-btn '+(mode==='integration'?'active':'')} onClick={()=>{setMode('integration');setSelected(null);}}><Boxes size={17}/> Integration view</button>
        <button className={'nav-btn '+(mode==='ai'?'active':'')} onClick={()=>{setMode('ai');setSelected(null);}}><Bot size={17}/> AI capability view</button>
        <div className="section-caption">ADD COMPONENT</div>
        <div className="component-buttons">{ComponentKind.options.map(k=><button key={k} onClick={()=>addComponent(k)}><Plus size={14}/>{kindNames[k]}</button>)}</div>
        <div className="section-caption">INTERFACES</div><div className="inventory">{project.interfaces.filter(e=>mode==='ai'||e.kind==='integration').map(e=><button key={e.id} className={selected?.id===e.id?'chosen':''} onClick={()=>setSelected({type:'interface',id:e.id})}><GitBranchPlus size={14}/><span>{e.name}<small>{e.protocol||'Protocol undecided'}</small></span></button>)}</div>
      </aside>
      <main className="canvas"><div className="canvas-toolbar"><span className="eyebrow">{mode==='integration'?'SYSTEM CONNECTIVITY':'AI CAPABILITY & ACCESS'}</span><span className="muted">{nodes.length} components · {edges.length} interfaces</span></div>
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onConnect={connect} onSelectionChange={selection} onPaneClick={()=>setSelected(null)} fitView fitViewOptions={{padding:.25}} minZoom={.3} maxZoom={1.8} nodesConnectable>
          <Background color="#2c3950" gap={22} size={1}/><MiniMap nodeColor="#435775" maskColor="rgba(9,14,24,.65)" pannable zoomable/><Controls/>
        </ReactFlow>
        <div className="canvas-help">Drag nodes to reposition · Drag between handles to connect · Select an object to inspect</div>
      </main>
      <aside className="inspector">
        <div className="panel-heading"><span>INSPECTOR</span>{selected&&<button className="danger-icon" onClick={removeSelected} title="Delete selected object"><Trash2 size={17}/></button>}</div>
        {selectedComponent?<div className="fields"><h2>{selectedComponent.name}</h2>
          <label>Display name<input value={selectedComponent.name} onChange={e=>setComponent({name:e.target.value})}/></label>
          <label>Type<select value={selectedComponent.kind} onChange={e=>setComponent({kind:ComponentKind.parse(e.target.value)})}>{ComponentKind.options.map(k=><option key={k} value={k}>{kindNames[k]}</option>)}</select></label>
          <label>Description<textarea value={selectedComponent.description} onChange={e=>setComponent({description:e.target.value})}/></label>
          <p className="muted">ID: {selectedComponent.id}</p>
        </div>:selectedInterface?<div className="fields"><h2>{selectedInterface.name}</h2>
          <label>Name<input value={selectedInterface.name} onChange={e=>setInterface({name:e.target.value})}/></label>
          <label>Interface type<select value={selectedInterface.kind} onChange={e=>setInterface({kind:InterfaceKind.parse(e.target.value)})}>{InterfaceKind.options.map(k=><option key={k} value={k}>{k}</option>)}</select></label>
          <label>Source<select value={selectedInterface.sourceId} onChange={e=>setInterface({sourceId:e.target.value})}>{project.components.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label>Target<select value={selectedInterface.targetId} onChange={e=>setInterface({targetId:e.target.value})}>{project.components.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          {(['protocol','authentication','authorization','contract','owner','description'] as const).map(k=><label key={k}>{k}<input value={selectedInterface[k]} onChange={e=>setInterface({[k]:e.target.value})}/></label>)}
          {(['access','idempotency','observability','enforcement'] as const).map(k=><label key={k}>{k}<select value={selectedInterface[k]} onChange={e=>setInterface({[k]:e.target.value})}>{(k==='access'?['unknown','read','write','approve']:k==='enforcement'?['unknown','documented','verified','not-applicable']:['unknown','defined','not-applicable']).map(v=><option key={v} value={v}>{v}</option>)}</select></label>)}
          <p className="muted">Documentation is not evidence of runtime enforcement.</p>
        </div>:<div className="empty-inspector"><ShieldCheck size={32}/><h2>Architecture explorer</h2><p>Select a system or interface to inspect its structured properties and decisions.</p></div>}
        <div className="findings"><div className="findings-header"><ShieldCheck size={16}/> VALIDATION <span>{findings.length}</span></div>{findings.length?findings.map(f=><button key={f.id} onClick={()=>setSelected({type:'interface',id:f.interfaceId})} className={'finding '+f.severity}><strong>{f.severity.toUpperCase()}</strong><span>{f.message}<small>{project.interfaces.find(e=>e.id===f.interfaceId)?.name}</small></span></button>):<p className="muted">No findings from the current limited rule set.</p>}</div>
        {error&&<div role="alert" className="error">{error}</div>}
      </aside>
    </div>
  </div>;
}
