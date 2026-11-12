import type {Project} from './model';

export interface HistoryState {
  past: Project[];
  present: Project;
  future: Project[];
  dragOrigin?: Project;
}
export type HistoryAction =
  | {type:'edit'; update:Project|((previous:Project)=>Project)}
  | {type:'drag-start'}
  | {type:'move'; update:(previous:Project)=>Project}
  | {type:'drag-stop'}
  | {type:'undo'}
  | {type:'redo'};

export const HISTORY_LIMIT=60;
export const initialHistory=(project:Project):HistoryState=>({past:[],present:project,future:[]});
const unchanged=(a:Project,b:Project)=>JSON.stringify(a)===JSON.stringify(b);

export function historyReducer(state:HistoryState,action:HistoryAction):HistoryState {
  switch(action.type){
    case 'edit':{
      const next=typeof action.update==='function'?action.update(state.present):action.update;
      if(unchanged(next,state.present))return state;
      return {past:[...state.past,state.present].slice(-HISTORY_LIMIT),present:next,future:[]};
    }
    case 'drag-start':return {...state,dragOrigin:state.present};
    case 'move':{
      const next=action.update(state.present);
      return unchanged(next,state.present)?state:{...state,present:next};
    }
    case 'drag-stop':{
      if(!state.dragOrigin)return state;
      if(unchanged(state.dragOrigin,state.present))return {...state,dragOrigin:undefined};
      return {past:[...state.past,state.dragOrigin].slice(-HISTORY_LIMIT),present:state.present,future:[],dragOrigin:undefined};
    }
    case 'undo':{
      if(!state.past.length)return state;
      const prev=state.past[state.past.length-1];
      return {past:state.past.slice(0,-1),present:prev,future:[state.present,...state.future]};
    }
    case 'redo':{
      if(!state.future.length)return state;
      const next=state.future[0];
      return {past:[...state.past,state.present].slice(-HISTORY_LIMIT),present:next,future:state.future.slice(1)};
    }
  }
}
