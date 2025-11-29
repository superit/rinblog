import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { client } from '../../main';
import { headersWithAuth } from '../../utils/auth';
import type { EditorCommand } from './types';

interface EditorToolbarProps {
  onCommand: (command: EditorCommand, payload?: string) => void;
  isActive: (command: EditorCommand) => boolean;
  disabled?: boolean;
}

interface ToolbarButtonProps {
  icon: string;
  title: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

function ToolbarButton({ icon, title, onClick, isActive, disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-8 h-8 flex items-center justify-center rounded
        transition-colors duration-150
        ${isActive 
          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <i className={`${icon} text-base`} />
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />;
}

export function EditorToolbar({ onCommand, isActive, disabled }: EditorToolbarProps) {
  const { t } = useTranslation();
  const uploadRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadImage = (file: File) => {
    setUploading(true);
    client.storage.index
      .post(
        { key: file.name, file: file },
        { headers: headersWithAuth() }
      )
      .then(({ data, error }) => {
        setUploading(false);
        if (error) {
          console.error(t('upload.failed'));
          return;
        }
        if (data) {
          onCommand('image', data);
        }
      })
      .catch((e) => {
        setUploading(false);
        console.error(e);
      });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert(t('file.too_large') || 'File too large (max 5MB)');
      if (uploadRef.current) uploadRef.current.value = '';
      return;
    }
    uploadImage(file);
    if (uploadRef.current) uploadRef.current.value = '';
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* 文本格式 */}
      <ToolbarButton
        icon="ri-bold"
        title={t('editor.bold') || 'Bold'}
        onClick={() => onCommand('bold')}
        isActive={isActive('bold')}
        disabled={disabled}
      />
      <ToolbarButton
        icon="ri-italic"
        title={t('editor.italic') || 'Italic'}
        onClick={() => onCommand('italic')}
        isActive={isActive('italic')}
        disabled={disabled}
      />
      <ToolbarButton
        icon="ri-strikethrough"
        title={t('editor.strikethrough') || 'Strikethrough'}
        onClick={() => onCommand('strikethrough')}
        isActive={isActive('strikethrough')}
        disabled={disabled}
      />
      <ToolbarButton
        icon="ri-code-line"
        title={t('editor.code') || 'Inline Code'}
        onClick={() => onCommand('code')}
        isActive={isActive('code')}
        disabled={disabled}
      />

      <ToolbarDivider />

      {/* 链接和媒体 */}
      <ToolbarButton
        icon="ri-link"
        title={t('editor.link') || 'Link'}
        onClick={() => {
          const url = prompt(t('editor.enter_url') || 'Enter URL:');
          if (url) onCommand('link', url);
        }}
        isActive={isActive('link')}
        disabled={disabled}
      />
      <ToolbarButton
        icon="ri-image-add-line"
        title={t('editor.image') || 'Image'}
        onClick={() => uploadRef.current?.click()}
        disabled={disabled || uploading}
      />
      <input
        ref={uploadRef}
        type="file"
        accept="image/gif,image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <ToolbarButton
        icon="ri-code-box-line"
        title={t('editor.code_block') || 'Code Block'}
        onClick={() => onCommand('codeBlock')}
        isActive={isActive('codeBlock')}
        disabled={disabled}
      />
      <ToolbarButton
        icon="ri-table-2"
        title={t('editor.table') || 'Table'}
        onClick={() => onCommand('table')}
        disabled={disabled}
      />

      <ToolbarDivider />

      {/* 列表 */}
      <ToolbarButton
        icon="ri-list-unordered"
        title={t('editor.bullet_list') || 'Bullet List'}
        onClick={() => onCommand('bulletList')}
        isActive={isActive('bulletList')}
        disabled={disabled}
      />
      <ToolbarButton
        icon="ri-list-ordered"
        title={t('editor.ordered_list') || 'Ordered List'}
        onClick={() => onCommand('orderedList')}
        isActive={isActive('orderedList')}
        disabled={disabled}
      />
      <ToolbarButton
        icon="ri-list-check-2"
        title={t('editor.task_list') || 'Task List'}
        onClick={() => onCommand('taskList')}
        isActive={isActive('taskList')}
        disabled={disabled}
      />

      <ToolbarDivider />

      {/* 块级元素 */}
      <ToolbarButton
        icon="ri-question-line"
        title={t('editor.blockquote') || 'Blockquote'}
        onClick={() => onCommand('blockquote')}
        isActive={isActive('blockquote')}
        disabled={disabled}
      />

      <div className="flex-grow" />

      {/* 撤销/重做 */}
      <ToolbarButton
        icon="ri-arrow-go-back-line"
        title={t('editor.undo') || 'Undo'}
        onClick={() => onCommand('undo')}
        disabled={disabled}
      />
      <ToolbarButton
        icon="ri-arrow-go-forward-line"
        title={t('editor.redo') || 'Redo'}
        onClick={() => onCommand('redo')}
        disabled={disabled}
      />

      {uploading && (
        <span className="ml-2 text-sm text-gray-500">{t('uploading') || 'Uploading...'}</span>
      )}
    </div>
  );
}
