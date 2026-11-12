import {describe,it,expect} from 'vitest';
import {sampleProject} from './model';
import {historyReducer,initialHistory,HISTORY_LIMIT} from './history';

describe('architecture edit history',()=>{
  it('undoes and redoes edits including project changes',()=>{
    const initial=initialHistory(sampleProject());
    const edited=historyReducer(initial,{type:'edit',update:p=>({...p,name:'Renamed architecture'})});
    expect(edited.past).toHaveLength(1);
    const undone=historyReducer(edited,{type:'undo'});
    expect(undone.present.name).toBe(initial.present.name);
    expect(historyReducer(undone,{type:'redo'}).present.name).toBe('Renamed architecture');
  });
  it('clears redo on a divergent edit and ignores no-op changes',()=>{
    const first=historyReducer(initialHistory(sampleProject()),{type:'edit',update:p=>({...p,name:'First'})});
    const undone=historyReducer(first,{type:'undo'});
    const next=historyReducer(undone,{type:'edit',update:p=>({...p,name:'Other'})});
    expect(next.future).toHaveLength(0);
    expect(historyReducer(next,{type:'edit',update:p=>p})).toBe(next);
  });
  it('combines multiple node movements into a single undo step',()=>{
    let state=historyReducer(initialHistory(sampleProject()),{type:'drag-start'});
    state=historyReducer(state,{type:'move',update:p=>({...p,components:p.components.map(c=>c.id==='sap'?{...c,x:700}:c)})});
    state=historyReducer(state,{type:'move',update:p=>({...p,components:p.components.map(c=>c.id==='sap'?{...c,x:800}:c)})});
    state=historyReducer(state,{type:'drag-stop'});
    expect(state.past).toHaveLength(1);
    expect(state.present.components.find(c=>c.id==='sap')?.x).toBe(800);
    expect(historyReducer(state,{type:'undo'}).present.components.find(c=>c.id==='sap')?.x).toBe(620);
  });
  it('does not create history when drag position is unchanged',()=>{
    let state=historyReducer(initialHistory(sampleProject()),{type:'drag-start'});
    state=historyReducer(state,{type:'drag-stop'});
    expect(state.past).toHaveLength(0);
  });
  it('limits retained history',()=>{
    let state=initialHistory(sampleProject());
    for(let i=0;i<HISTORY_LIMIT+10;i++)state=historyReducer(state,{type:'edit',update:p=>({...p,name:'v'+i})});
    expect(state.past).toHaveLength(HISTORY_LIMIT);
  });
});
