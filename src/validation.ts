import type { Project, ArchitectureInterface } from './model';

export type Finding = { id:string; interfaceId:string; severity:'warning'|'info'; message:string };
export function validateProject(project:Project):Finding[] {
  const findings:Finding[]=[];
  const add=(e:ArchitectureInterface,rule:string,severity:Finding['severity'],message:string)=>{
    findings.push({id:rule+':'+e.id,interfaceId:e.id,severity,message});
  };
  for(const e of project.interfaces){
    if(!e.owner.trim()) add(e,'owner','warning','Technical owner is not defined.');
    if(!e.authentication.trim()) add(e,'auth','warning','Authentication is not defined.');
    if(!e.authorization.trim()) add(e,'authorization','warning','Authorization is not defined.');
    if(!e.contract.trim()) add(e,'contract','info','Contract/schema reference is missing.');
    if(e.observability==='unknown') add(e,'observability','info','Monitoring and observability are undecided.');
    if(e.idempotency==='unknown'&&e.access==='write') add(e,'idempotency','warning','Write operation has no documented duplicate-handling decision.');
    if(e.kind==='tool'&&e.enforcement==='unknown') add(e,'enforcement','warning','Actual downstream authorization enforcement is unverified/unspecified.');
    if(e.kind==='tool'&&e.access==='unknown') add(e,'access','warning','AI tool side effects are not classified.');
    if(e.kind==='tool'&&e.enforcement==='documented') add(e,'verification','info','Declared enforcement has not been runtime-verified.');
  }
  return findings;
}
export function summarizeFindings(findings:Finding[]):string {
  return findings.length+' finding(s): '+findings.filter(f=>f.severity==='warning').length+' warnings';
}
