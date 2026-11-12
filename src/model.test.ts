import { describe,expect,it } from 'vitest';
import { addCapability,createFromTemplate,parseProject,removeComponent,removeCapability,sampleProject,updateComponent,updateInterface } from './model';
import {validateProject} from './validation';

describe('architecture model',()=>{
  it('round trips the sample',()=>{const p=sampleProject(); expect(parseProject(JSON.parse(JSON.stringify(p)))).toEqual(p);});
  it('rejects dangling references',()=>{
    const p=sampleProject();p.components=p.components.filter(c=>c.id!=='sap');
    expect(()=>parseProject(p)).toThrow();
  });
  it('updates components without changing identity',()=>{
    const p=sampleProject();const q=updateComponent(p,'sap',{name:'SAP Test',id:'malicious'});
    expect(q.components.find(c=>c.id==='sap')?.name).toBe('SAP Test');
    expect(q.components.find(c=>c.id==='sap')?.id).toBe('sap');
  });
  it('removes connected interfaces when deleting a system',()=>{
    const q=removeComponent(sampleProject(),'sap');
    expect(q.interfaces.every(e=>e.sourceId!=='sap'&&e.targetId!=='sap')).toBe(true);
  });
  it('loads legacy projects without capabilities and preserves the default example',()=>{
    const legacy=sampleProject() as Record<string,unknown>;delete legacy.capabilities;for(const link of legacy.interfaces as Record<string,unknown>[]){delete link.capabilityId;}
    expect(parseProject(legacy).capabilities).toEqual([]);
    expect(sampleProject().capabilities.some(c=>c.kind==='mcp-tool')).toBe(true);
  });
  it('rejects orphaned and duplicated capabilities',()=>{
    const p=sampleProject();p.capabilities[0].componentId='missing';
    expect(()=>parseProject(p)).toThrow();
    const q=sampleProject();q.capabilities.push({...q.capabilities[0]});
    expect(()=>parseProject(q)).toThrow();
  });
  it('removes capabilities with owning assets',()=>{
    const next=removeComponent(sampleProject(),'gateway');
    expect(next.capabilities.every(c=>c.componentId!=='gateway')).toBe(true);
  });
  it('creates catalog assets and editable capabilities',()=>{
    const project=createFromTemplate(sampleProject(),0);
    expect(project.components.length).toBe(7);
    const next=addCapability(project,'sap','mcp-tool');
    expect(next.capabilities.length).toBe(4);
    expect(removeCapability(next,next.capabilities.at(-1)!.id).capabilities.length).toBe(3);
  });
  it('rejects a capability bound to the wrong target asset',()=>{
    const p=sampleProject();
    const tool=p.interfaces.find(e=>e.id==='tool-invoke')!;
    tool.capabilityId='erp-read-cap';
    expect(()=>parseProject(p)).toThrow();
  });
  it('clears capability bindings when capability is removed or interface retargeted',()=>{
    const p=sampleProject();
    const q=removeCapability(p,'invoice-read-cap');
    expect(q.interfaces.find(e=>e.id==='tool-invoke')?.capabilityId).toBeUndefined();
    const reTarget=updateInterface(p,'tool-invoke',{targetId:'sap'});
    expect(reTarget.interfaces.find(e=>e.id==='tool-invoke')?.capabilityId).toBeUndefined();
  });
  it('highlights unknown idempotency and enforcement',()=>{
    const findings=validateProject(sampleProject());
    expect(findings.some(f=>f.id==='idempotency:erp-post')).toBe(true);
    expect(findings.some(f=>f.id==='enforcement:tool-backend')).toBe(true);
    expect(findings.some(f=>f.id==='verification:tool-invoke')).toBe(true);
  });
});
