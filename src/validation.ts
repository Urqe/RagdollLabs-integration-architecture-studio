import type {Project,ArchitectureInterface} from './model';

export type Finding={id:string;interfaceId:string;severity:'warning'|'info';message:string};
export function validateProject(project:Project):Finding[]{
  const findings:Finding[]=[];
  const add=(e:ArchitectureInterface,rule:string,severity:Finding['severity'],message:string)=>{
    findings.push({id:rule+':'+e.id,interfaceId:e.id,severity,message});
  };
  for(const e of project.interfaces){
    const capability=project.capabilities.find(c=>c.id===e.capabilityId);
    if(e.sourceId===e.targetId)add(e,'self-loop','info','Source and target are the same asset; verify this is intentional.');
    if(!e.name.trim())add(e,'name','warning','Interface name is missing.');
    if(!e.description.trim())add(e,'purpose','info','Business purpose is not documented.');
    if(!e.protocol.trim())add(e,'protocol','warning','Transport or invocation protocol is undecided.');
    if(!e.owner.trim())add(e,'owner','warning','Technical owner is not defined.');
    if(!e.authentication.trim())add(e,'auth','warning','Authentication is not defined.');
    if(!e.authorization.trim())add(e,'authorization','warning','Authorization is not defined.');
    if(!e.contract.trim())add(e,'contract','info','Contract/schema reference is missing.');
    if(e.observability==='unknown')add(e,'observability','info','Monitoring and observability are undecided.');
    if(e.idempotency==='unknown'&&(e.access==='write'||e.access==='approve'))add(e,'idempotency','warning','Mutating operation has no documented duplicate-handling decision.');
    if(e.access==='unknown')add(e,'side-effects','warning','The interface read/write/approval behavior is undecided.');
    if(e.kind==='tool'&&!e.capabilityId)add(e,'capability','warning','AI tool invocation has no modeled target capability.');
    if(e.kind==='tool'&&e.enforcement==='unknown')add(e,'enforcement','warning','Actual downstream authorization enforcement is unverified/unspecified.');
    if(e.kind==='tool'&&e.enforcement==='not-applicable')add(e,'enforcement-na','warning','AI tool authorization enforcement is marked not applicable; justify this boundary.');
    if(e.kind==='tool'&&e.enforcement==='documented')add(e,'verification','info','Declared enforcement has not been runtime-verified.');
    if(capability&&capability.access==='unknown')add(e,'capability-access','warning','Consumed capability has undecided access level.');
    if(capability&&capability.evidence==='template')add(e,'capability-evidence','info','Consumed capability comes from a template, not verified deployed metadata.');
    if(capability&&capability.access==='read'&&(e.access==='write'||e.access==='approve'))add(e,'access-mismatch','warning','Interface attempts a mutating action against a read-only modeled capability.');
    if(e.kind==='tool'&&e.access==='approve'&&e.enforcement!=='verified')add(e,'approval','warning','AI approval capability has no verified runtime enforcement.');
  }
  return findings;
}
export function summarizeFindings(findings:Finding[]):string {
  return findings.length+' finding(s): '+findings.filter(f=>f.severity==='warning').length+' warnings';
}
