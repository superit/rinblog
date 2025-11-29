/**
 * 富文本编辑器类型定义
 */

export interface RichEditorProps {
  content: string;
  setContent: (content: string) => void;
  placeholder?: string;
  height?: string;
}

export interface ToolbarButtonProps {
  icon: string;
  title: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

export type EditorCommand = 
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'code'
  | 'link'
  | 'image'
  | 'codeBlock'
  | 'table'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'blockquote'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'horizontalRule'
  | 'undo'
  | 'redo';
