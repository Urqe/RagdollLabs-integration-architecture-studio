import { parseProject, sampleProject, type Project } from './model';

const KEY='ragdollabs-architecture-studio-v1';
export function loadProject():Project {
  try {const raw=localStorage.getItem(KEY);return raw?parseProject(JSON.parse(raw)):sampleProject();}
  catch { return sampleProject(); }
}
export function saveProject(project:Project):void {localStorage.setItem(KEY,JSON.stringify(parseProject(project)));}
export function exportProject(project:Project):void {
  const blob=new Blob([JSON.stringify(parseProject(project),null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='architecture-project.json';a.click();
  URL.revokeObjectURL(url);
}
export async function importProject(file:File):Promise<Project> {
  if(file.size>2_000_000) throw new Error('Project file exceeds 2 MB limit.');
  return parseProject(JSON.parse(await file.text()));
}
