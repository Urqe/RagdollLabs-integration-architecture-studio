import { z } from 'zod';

export const ComponentKind = z.enum(['system','ipaas','gateway','agent','external']);
export const InterfaceKind = z.enum(['integration','tool']);
export const CapabilitySchema = z.object({
  id:z.string().min(1), componentId:z.string().min(1), name:z.string().min(1),
  kind:z.enum(['api','mcp-tool','event','file','agent-delegation']),
  operation:z.string(), description:z.string(),
  access:z.enum(['unknown','read','write','approve']),
  evidence:z.enum(['template','declared','verified'])
});
export type Capability = z.infer<typeof CapabilitySchema>;
export const COMPONENT_TEMPLATES = [
  {name:'SAP S/4HANA',kind:'system',description:'ERP system; verify actual deployed interfaces'},
  {name:'Microsoft Dynamics 365',kind:'system',description:'Business applications; available APIs vary by workload'},
  {name:'Salesforce',kind:'system',description:'CRM platform'},
  {name:'Workato',kind:'ipaas',description:'Integration and automation platform'},
  {name:'Azure Logic Apps',kind:'ipaas',description:'Azure workflow integration service'},
  {name:'REST API',kind:'external',description:'Custom API service'},
  {name:'Event Broker',kind:'system',description:'Publish/subscribe messaging'},
  {name:'MCP Gateway',kind:'gateway',description:'Agent tool exposure and authorization boundary'},
  {name:'AI Agent',kind:'agent',description:'AI client that may invoke authorized tools'}
] as const satisfies ReadonlyArray<{name:string;kind:z.infer<typeof ComponentKind>;description:string}>;
export const ComponentSchema = z.object({
  id:z.string().min(1), name:z.string().min(1), kind:ComponentKind, description:z.string(),
  x:z.number().finite(), y:z.number().finite()
});
export const InterfaceSchema = z.object({
  id:z.string().min(1), name:z.string().min(1), kind:InterfaceKind,
  sourceId:z.string().min(1), targetId:z.string().min(1),
  capabilityId:z.string().min(1).optional(),
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
  interfaces:z.array(InterfaceSchema),
  capabilities:z.array(CapabilitySchema).default([])
}).superRefine((p,ctx)=>{
  const nodes = new Set<string>();
  p.components.forEach((n,i)=>{if(nodes.has(n.id))ctx.addIssue({code:'custom',message:'Duplicate component ID',path:['components',i,'id']});nodes.add(n.id)});
  const capabilities = new Set<string>();
  p.capabilities.forEach((c,i)=>{
    if(capabilities.has(c.id))ctx.addIssue({code:'custom',message:'Duplicate capability ID',path:['capabilities',i,'id']});
    capabilities.add(c.id);
    if(!nodes.has(c.componentId))ctx.addIssue({code:'custom',message:'Capability has unknown owner component',path:['capabilities',i,'componentId']});
  });
  const links = new Set<string>();
  p.interfaces.forEach((e,i)=>{
    if(links.has(e.id))ctx.addIssue({code:'custom',message:'Duplicate interface ID',path:['interfaces',i,'id']});
    links.add(e.id);
    if(!nodes.has(e.sourceId)||!nodes.has(e.targetId))ctx.addIssue({code:'custom',message:'Unknown source or target',path:['interfaces',i]});
    if(e.capabilityId){
      const capability=p.capabilities.find(c=>c.id===e.capabilityId);
      if(!capability)ctx.addIssue({code:'custom',message:'Interface refers to missing capability',path:['interfaces',i,'capabilityId']});
      else if(capability.componentId!==e.targetId)ctx.addIssue({code:'custom',message:'Consumed capability must belong to target asset',path:['interfaces',i,'capabilityId']});
    }
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
    capabilities:[
    {id:'invoice-read-cap',componentId:'gateway',name:'get_invoice',kind:'mcp-tool',operation:'get_invoice(invoiceId)',description:'Lookup one invoice by ID',access:'read',evidence:'declared'},
    {id:'invoice-api-cap',componentId:'api',name:'Read invoice API',kind:'api',operation:'GET /invoices/{id}',description:'Backend read operation',access:'read',evidence:'declared'},
    {id:'erp-read-cap',componentId:'sap',name:'Invoice OData service',kind:'api',operation:'GET Invoice',description:'ERP read surface; deployment not verified',access:'read',evidence:'template'}
  ],
    interfaces:[
      {id:'customer-sync',name:'Customer sync',kind:'integration',sourceId:'salesforce',targetId:'workato',protocol:'REST / JSON',authentication:'OAuth 2.0',authorization:'Service scope',contract:'OpenAPI (planned)',owner:'Integration team',description:'Synchronize customer details',idempotency:'defined',observability:'defined',enforcement:'not-applicable',access:'write'},
      {id:'erp-post',name:'ERP invoice exchange',kind:'integration',sourceId:'workato',targetId:'sap',protocol:'OData',authentication:'OAuth 2.0',authorization:'Restricted service role',contract:'OData service metadata',owner:'ERP integration',description:'Deliver validated invoice records',idempotency:'unknown',observability:'defined',enforcement:'not-applicable',access:'write'},
      {id:'tool-invoke',name:'get_invoice',kind:'tool',sourceId:'agent',targetId:'gateway',capabilityId:'invoice-read-cap',protocol:'MCP tool',authentication:'Agent identity',authorization:'Invoice.read',contract:'JSON input/output schema',owner:'AI platform',description:'Look up an invoice by ID',idempotency:'not-applicable',observability:'defined',enforcement:'documented',access:'read'},
      {id:'tool-backend',name:'Invoice read API',kind:'tool',sourceId:'gateway',targetId:'api',capabilityId:'invoice-api-cap',protocol:'HTTPS REST',authentication:'Workload identity',authorization:'Invoice.read',contract:'OpenAPI',owner:'AI platform',description:'Downstream read-only invoice lookup',idempotency:'not-applicable',observability:'defined',enforcement:'unknown',access:'read'},
      {id:'invoice-fetch',name:'Read ERP invoice',kind:'integration',sourceId:'api',targetId:'sap',capabilityId:'erp-read-cap',protocol:'OData',authentication:'OAuth 2.0',authorization:'Read-only role',contract:'OData service metadata',owner:'ERP integration',description:'Fetch invoice details',idempotency:'not-applicable',observability:'defined',enforcement:'not-applicable',access:'read'}
    ]
  };
}
export function parseProject(value:unknown):Project { return ProjectSchema.parse(value); }
export function updateComponent(project:Project,id:string,patch:Partial<Component>):Project {
  return {...project,components:project.components.map(c=>c.id===id?{...c,...patch,id:c.id}:c)};
}
export function updateInterface(project:Project,id:string,patch:Partial<ArchitectureInterface>):Project {
  return {...project,interfaces:project.interfaces.map(e=>{
    if(e.id!==id)return e;
    const next={...e,...patch,id:e.id};
    if(next.capabilityId&&!project.capabilities.some(c=>c.id===next.capabilityId&&c.componentId===next.targetId))next.capabilityId=undefined;
    return next;
  })};
}
export function removeComponent(project:Project,id:string):Project {
  return {...project,components:project.components.filter(c=>c.id!==id),interfaces:project.interfaces.filter(e=>e.sourceId!==id&&e.targetId!==id),capabilities:project.capabilities.filter(c=>c.componentId!==id)};
}
export function removeInterface(project:Project,id:string):Project {
  return {...project,interfaces:project.interfaces.filter(e=>e.id!==id)};
}

export function addCapability(project:Project,componentId:string,kind:Capability['kind']='api'):Project {
  if(!project.components.some(c=>c.id===componentId))return project;
  return {...project,capabilities:[...project.capabilities,{id:newId('cap'),componentId,name:'New capability',kind,operation:'',description:'',access:'unknown',evidence:'declared'}]};
}
export function updateCapability(project:Project,id:string,patch:Partial<Capability>):Project {
  return {...project,capabilities:project.capabilities.map(c=>c.id===id?{...c,...patch,id:c.id,componentId:c.componentId}:c)};
}
export function removeCapability(project:Project,id:string):Project {
  return {...project,capabilities:project.capabilities.filter(c=>c.id!==id),interfaces:project.interfaces.map(e=>e.capabilityId===id?{...e,capabilityId:undefined}:e)};
}
export function createFromTemplate(project:Project,index:number):Project {
  const template=COMPONENT_TEMPLATES[index];
  if(!template)return project;
  const component:Component={id:newId('component'),name:template.name,kind:template.kind,description:template.description,x:110+project.components.length*37,y:130+project.components.length*29};
  return {...project,components:[...project.components,component]};
}
