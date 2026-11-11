import { describe,expect,it } from 'vitest';
import { parseProject,removeComponent,sampleProject,updateComponent } from './model';
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
  it('highlights unknown idempotency and enforcement',()=>{
    const findings=validateProject(sampleProject());
    expect(findings.some(f=>f.id==='idempotency:erp-post')).toBe(true);
    expect(findings.some(f=>f.id==='enforcement:tool-backend')).toBe(true);
    expect(findings.some(f=>f.id==='verification:tool-invoke')).toBe(true);
  });
});
