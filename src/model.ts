import { z } from 'zod';

export const ComponentKind = z.enum(['system','ipaas','gateway','agent','external']);
export const InterfaceKind = z.enum(['integration','tool']);
export const ComponentSchema = z.object({
  id:z.string().min(1), name:z.string().min(1), kind:ComponentKind, description:z.string(),
  x:z.number().finite(), y:z.number().finite()
});
export const InterfaceSchema = z.object({
  id:z.string().min(1), name:z.string().min(1), kind:InterfaceKind,
  sourceId:z.string().min(1), targetId:z.string().min(1),
  protocol:z.string(), authentication:z.string(), authorization:z.string(),
  contract:z.string(), owner:z.string(), description:z.string(),
  idempotency:z.enum(['unknown','defined','not-applicable']),
  observability:z.enum(['unknown','defined','not-applicable']),
  enforcement:z.enum(['unknown','documented','verified','not-applicable']),
  access:z.enum(['read','write','approve','unknown'])
});
export const ProjectSchema = z.object({
  version:z.literal(1), id:z.string().min(1), name:z.string().min(1),
  description:z.string(), components:z.array(ComponentSchema),
  interfaces:z.array(InterfaceSchema)
}).superRefine((p,ctx)=>{
  const nodes = new Set<string>();
  p.components.forEach((n,i)=>{if(nodes.has(n.id))ctx.addIssue({code:'custom',message:'Duplicate component ID',path:['components',i,'id']});nodes.add(n.id)});
  const links = new Set<string>();
  p.interfaces.forEach((e,i)=>{
    if(links.has(e.id))ctx.addIssue({code:'custom',message:'Duplicate interface ID',path:['interfaces',i,'id']});
    links.add(e.id);
    if(!nodes.has(e.sourceId)||!nodes.has(e.targetId))ctx.addIssue({code:'custom',message:'Unknown source or target',path:['interfaces',i]});
  });
});
export type Component = z.infer<typeof ComponentSchema>;
export type ArchitectureInterface = z.infer<typeof InterfaceSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ViewMode = 'integration' | 'ai';

export function newId(prefix:string):string { return prefix+'-'+crypto.randomUUID().slice(0,8); }
export function sampleProject():Project {
  return { version:1,id:'sample-invoice',name:'Intelligent Invoice Processing',description:'Illustrative SAP–iPaaS–AI-agent integration. No live connections.',
    components:[
      {id:'salesforce',name:'Salesforce',kind:'system',description:'Customer records',x:20,y:80},
      {id:'workato',name:'Workato',kind:'ipaas',description:'Integration orchestration',x:320,y:80},
      {id:'sap',name:'SAP S/4HANA',kind:'system',description:'Invoice and vendor data',x:620,y:80},
      {id:'agent',name:'Invoice Assistant',kind:'agent',description:'AI agent requesting invoice lookup',x:20,y:330},
      {id:'gateway',name:'Tool Gateway',kind:'gateway',description:'Policy enforcement and tool dispatch',x:320,y:330},
      {id:'api',name:'Invoice Service',kind:'external',description:'Facade for authorized invoice reads',x:620,y:330}
    ],
    interfaces:[
      {id:'customer-sync',name:'Customer sync',kind:'integration',sourceId:'salesforce',targetId:'workato',protocol:'REST / JSON',authentication:'OAuth 2.0',authorization:'Service scope',contract:'OpenAPI (planned)',owner:'Integration team',description:'Synchronize customer details',idempotency:'defined',observability:'defined',enforcement:'not-applicable',access:'write'},
      {id:'erp-post',name:'ERP invoice exchange',kind:'integration',sourceId:'workato',targetId:'sap',protocol:'OData',authentication:'OAuth 2.0',authorization:'Restricted service role',contract:'OData service metadata',owner:'ERP integration',description:'Deliver validated invoice records',idempotency:'unknown',observability:'defined',enforcement:'not-applicable',access:'write'},
      {id:'tool-invoke',name:'get_invoice',kind:'tool',sourceId:'agent',targetId:'gateway',protocol:'MCP tool',authentication:'Agent identity',authorization:'Invoice.read',contract:'JSON input/output schema',owner:'AI platform',description:'Look up an invoice by ID',idempotency:'not-applicable',observability:'defined',enforcement:'documented',access:'read'},
      {id:'tool-backend',name:'Invoice read API',kind:'tool',sourceId:'gateway',targetId:'api',protocol:'HTTPS REST',authentication:'Workload identity',authorization:'Invoice.read',contract:'OpenAPI',owner:'AI platform',description:'Downstream read-only invoice lookup',idempotency:'not-applicable',observability:'defined',enforcement:'unknown',access:'read'},
      {id:'invoice-fetch',name:'Read ERP invoice',kind:'integration',sourceId:'api',targetId:'sap',protocol:'OData',authentication:'OAuth 2.0',authorization:'Read-only role',contract:'OData service metadata',owner:'ERP integration',description:'Fetch invoice details',idempotency:'not-applicable',observability:'defined',enforcement:'not-applicable',access:'read'}
    ]
  };
}
export function parseProject(value:unknown):Project { return ProjectSchema.parse(value); }
export function updateComponent(project:Project,id:string,patch:Partial<Component>):Project {
  return {...project,components:project.components.map(c=>c.id===id?{...c,...patch,id:c.id}:c)};
}
export function updateInterface(project:Project,id:string,patch:Partial<ArchitectureInterface>):Project {
  return {...project,interfaces:project.interfaces.map(e=>e.id===id?{...e,...patch,id:e.id}:e)};
}
export function removeComponent(project:Project,id:string):Project {
  return {...project,components:project.components.filter(c=>c.id!==id),interfaces:project.interfaces.filter(e=>e.sourceId!==id&&e.targetId!==id)};
}
export function removeInterface(project:Project,id:string):Project {
  return {...project,interfaces:project.interfaces.filter(e=>e.id!==id)};
}
