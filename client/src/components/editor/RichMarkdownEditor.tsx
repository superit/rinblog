import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Markdown } from '../markdown';
import { EditorToolbar } from './EditorToolbar';
import type { EditorCommand, RichEditorProps } from './types';

/**
 * 富文本 Markdown 编辑器
 * 左侧源码编辑 + 右侧实时预览
 */
export function RichMarkdownEditor({ 
  content, 
  setContent, 
  placeholder = '# 开始写作...',
  height = '500px' 
}: RichEditorProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  // 恢复光标位置
  const restoreSelection = useCallback((start: number, end: number) => {
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start, end);
      }
    }, 0);
  }, []);

  // 插入文本到光标位置
  const insertText = useCallback((before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultText;
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    
    const newCursorPos = start + before.length + selectedText.length;
    restoreSelection(start + before.length, newCursorPos);
  }, [content, setContent, restoreSelection]);

  // 在行首插入文本
  const insertAtLineStart = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = content.indexOf('\n', start);
    const actualLineEnd = lineEnd === -1 ? content.length : lineEnd;
    const currentLine = content.substring(lineStart, actualLineEnd);

    // 检查是否已有该前缀
    if (currentLine.startsWith(prefix)) {
      // 移除前缀
      const newContent = content.substring(0, lineStart) + currentLine.substring(prefix.length) + content.substring(actualLineEnd);
      setContent(newContent);
      restoreSelection(start - prefix.length, start - prefix.length);
    } else {
      // 添加前缀
      const newContent = content.substring(0, lineStart) + prefix + content.substring(lineStart);
      setContent(newContent);
      restoreSelection(start + prefix.length, start + prefix.length);
    }
  }, [content, setContent, restoreSelection]);

  // 包裹选中文本
  const wrapSelection = useCallback((wrapper: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    // 检查是否已被包裹
    const beforeWrapper = content.substring(Math.max(0, start - wrapper.length), start);
    const afterWrapper = content.substring(end, end + wrapper.length);

    if (beforeWrapper === wrapper && afterWrapper === wrapper) {
      // 移除包裹
      const newContent = content.substring(0, start - wrapper.length) + selectedText + content.substring(end + wrapper.length);
      setContent(newContent);
      restoreSelection(start - wrapper.length, end - wrapper.length);
    } else {
      // 添加包裹
      const newContent = content.substring(0, start) + wrapper + selectedText + wrapper + content.substring(end);
      setContent(newContent);
      restoreSelection(start + wrapper.length, end + wrapper.length);
    }
  }, [content, setContent, restoreSelection]);

  // 处理工具栏命令
  const handleCommand = useCallback((command: EditorCommand, payload?: string) => {
    switch (command) {
      case 'bold':
        wrapSelection('**');
        break;
      case 'italic':
        wrapSelection('*');
        break;
      case 'strikethrough':
        wrapSelection('~~');
        break;
      case 'code':
        wrapSelection('`');
        break;
      case 'link': {
        if (payload) {
          const textarea = textareaRef.current;
          if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = content.substring(start, end) || t('editor.link_text') || 'link text';
            insertText(`[${selectedText}](`, ')', payload);
          }
        }
        break;
      }
      case 'image':
        if (payload) {
          insertText(`![image](${payload})\n`, '', '');
        }
        break;
      case 'codeBlock':
        insertText('\n```\n', '\n```\n', 'code');
        break;
      case 'table':
        insertText('\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |\n', '', '');
        break;
      case 'bulletList':
        insertAtLineStart('- ');
        break;
      case 'orderedList':
        insertAtLineStart('1. ');
        break;
      case 'taskList':
        insertAtLineStart('- [ ] ');
        break;
      case 'blockquote':
        insertAtLineStart('> ');
        break;
      case 'heading1':
        insertAtLineStart('# ');
        break;
      case 'heading2':
        insertAtLineStart('## ');
        break;
      case 'heading3':
        insertAtLineStart('### ');
        break;
      case 'horizontalRule':
        insertText('\n---\n', '', '');
        break;
      case 'undo':
        document.execCommand('undo');
        break;
      case 'redo':
        document.execCommand('redo');
        break;
    }
  }, [content, insertText, insertAtLineStart, wrapSelection, t]);

  // 检查当前是否激活某个格式
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isActive = useCallback((_command: EditorCommand): boolean => {
    // 简单实现，后续可以增强
    return false;
  }, []);

  // 处理键盘快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          handleCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          handleCommand('italic');
          break;
        case 'k':
          e.preventDefault();
          const url = prompt(t('editor.enter_url') || 'Enter URL:');
          if (url) handleCommand('link', url);
          break;
      }
    }
  }, [handleCommand, t]);

  // 处理粘贴图片
  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // 使用工具栏的上传逻辑
          handleCommand('image', URL.createObjectURL(file));
        }
        break;
      }
    }
  }, [handleCommand]);

  // 处理 Tab 键
  const handleTab = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      insertText('  ', '', '');
    }
  }, [insertText]);

  return (
    <div className="flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {/* 工具栏 */}
      <EditorToolbar 
        onCommand={handleCommand} 
        isActive={isActive}
      />
      
      {/* 编辑区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
        {/* 左侧：Markdown 源码编辑 */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              handleKeyDown(e);
              handleTab(e);
            }}
            onPaste={handlePaste}
            placeholder={placeholder}
            className="w-full resize-none p-4 font-mono text-sm leading-relaxed
              bg-white dark:bg-gray-900 
              text-gray-800 dark:text-gray-200
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none"
            style={{ height, minHeight: height }}
          />
          {/* 拖拽调整大小的手柄 */}
          <div className="absolute bottom-1 right-1 text-gray-400 dark:text-gray-600 pointer-events-none">
            <i className="ri-drag-move-2-line text-xs" />
          </div>
        </div>

        {/* 右侧：实时预览 */}
        <div 
          className="overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900"
          style={{ height, minHeight: height }}
        >
          {content ? (
            <Markdown content={content} />
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic">
              {t('editor.preview_placeholder') || 'Preview will appear here...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
