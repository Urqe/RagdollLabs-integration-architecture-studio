import {describe,expect,it} from 'vitest';
import {sampleProject} from './model';
import {validateProject} from './validation';

describe('explainable architecture rules',()=>{
  it('reports original fictional design gaps',()=>{
    const findings=validateProject(sampleProject());
    expect(findings.some(f=>f.id==='idempotency:erp-post')).toBe(true);
    expect(findings.some(f=>f.id==='verification:tool-invoke')).toBe(true);
    expect(findings.some(f=>f.id==='capability-evidence:invoice-fetch')).toBe(true);
  });
  it('flags AI operation against read-only capability',()=>{
    const project=sampleProject();
    project.interfaces.find(e=>e.id==='tool-invoke')!.access='write';
    const findings=validateProject(project);
    expect(findings.some(f=>f.id==='access-mismatch:tool-invoke')).toBe(true);
  });
  it('finds missing protocol, missing business purpose and missing binding',()=>{
    const project=sampleProject();
    const tool=project.interfaces.find(e=>e.id==='tool-invoke')!;
    tool.protocol='';tool.description='';tool.capabilityId=undefined;
    const ids=validateProject(project).map(f=>f.id);
    expect(ids).toContain('protocol:tool-invoke');
    expect(ids).toContain('purpose:tool-invoke');
    expect(ids).toContain('capability:tool-invoke');
  });
  it('does not confuse a declared permission with verified enforcement',()=>{
    const project=sampleProject();
    expect(validateProject(project).some(f=>f.id==='verification:tool-invoke')).toBe(true);
  });
});
