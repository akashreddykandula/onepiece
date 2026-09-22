import { useEffect, useState } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

const BLOCK_TYPES = [
  {
    type: "hero",
    label: "Hero Section",
    description: "Large page introduction",
  },
  {
    type: "text",
    label: "Text Section",
    description: "Heading and paragraph",
  },
  {
    type: "info",
    label: "Info Card",
    description: "Highlighted information",
  },
  {
    type: "checklist",
    label: "Checklist",
    description: "List of points",
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Question and answer",
  },
  {
    type: "imageText",
    label: "Image + Text",
    description: "Image with content",
  },
  {
    type: "notice",
    label: "Notice",
    description: "Important announcement",
  },
  {
    type: "contact",
    label: "Contact",
    description: "Contact information",
  },
];

const createBlock = (type, order = 0) => ({
  type,
  title: "",
  subtitle: "",
  content: "",
  image: "",
  items: [],
  order,
});

function BlockField({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function BlockEditor({
  block,
  index,
  total,
  onChange,
  onDelete,
  onDuplicate,
  onMove,
}) {
  const [open, setOpen] = useState(true);

  const update = (field, value) => {
    onChange(index, {
      ...block,
      [field]: value,
    });
  };

  const updateItem = (itemIndex, value) => {
    const items = [...(block.items || [])];
    items[itemIndex] = value;

    onChange(index, {
      ...block,
      items,
    });
  };

  const addItem = () => {
    onChange(index, {
      ...block,
      items: [...(block.items || []), ""],
    });
  };

  const removeItem = (itemIndex) => {
    onChange(index, {
      ...block,
      items: (block.items || []).filter((_, i) => i !== itemIndex),
    });
  };

  const typeInfo = BLOCK_TYPES.find((item) => item.type === block.type);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-3 min-w-0 text-left"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 font-bold text-sm">
            {index + 1}
          </span>

          <span className="min-w-0">
            <span className="block font-semibold text-gray-900">
              {typeInfo?.label || block.type}
            </span>

            <span className="block text-xs text-gray-400 truncate">
              {typeInfo?.description}
            </span>
          </span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            className="btn-icon disabled:opacity-30"
            title="Move up"
          >
            <FiChevronUp size={15} />
          </button>

          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
            className="btn-icon disabled:opacity-30"
            title="Move down"
          >
            <FiChevronDown size={15} />
          </button>

          <button
            type="button"
            onClick={() => onDuplicate(index)}
            className="btn-icon"
            title="Duplicate block"
          >
            <FiCopy size={14} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(index)}
            className="btn-icon text-red-500 hover:bg-red-50"
            title="Delete block"
          >
            <FiTrash2 size={14} />
          </button>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="btn-icon"
            title={open ? "Collapse" : "Expand"}
          >
            {open ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="p-5 space-y-4">
          {(block.type === "hero" ||
            block.type === "text" ||
            block.type === "info" ||
            block.type === "checklist" ||
            block.type === "faq" ||
            block.type === "imageText" ||
            block.type === "contact") && (
            <BlockField label="Heading">
              <input
                value={block.title || ""}
                onChange={(e) => update("title", e.target.value)}
                className="input"
                placeholder="Enter heading"
              />
            </BlockField>
          )}

          {(block.type === "hero" || block.type === "imageText") && (
            <BlockField label="Subtitle">
              <input
                value={block.subtitle || ""}
                onChange={(e) => update("subtitle", e.target.value)}
                className="input"
                placeholder="Enter subtitle"
              />
            </BlockField>
          )}

          {(block.type === "text" ||
            block.type === "info" ||
            block.type === "notice" ||
            block.type === "contact" ||
            block.type === "hero" ||
            block.type === "imageText") && (
            <BlockField label="Content">
              <textarea
                value={block.content || ""}
                onChange={(e) => update("content", e.target.value)}
                className="input resize-y"
                rows={5}
                placeholder="Enter your content..."
              />
            </BlockField>
          )}

          {block.type === "imageText" && (
            <BlockField label="Image URL">
              <input
                value={block.image || ""}
                onChange={(e) => update("image", e.target.value)}
                className="input"
                placeholder="https://..."
              />
              <p className="text-xs text-gray-400 mt-1">
                We'll replace this with the media uploader later.
              </p>
            </BlockField>
          )}

          {block.type === "checklist" && (
            <BlockField label="Checklist Items">
              <div className="space-y-2">
                {(block.items || []).map((item, itemIndex) => (
                  <div key={itemIndex} className="flex gap-2">
                    <input
                      value={item}
                      onChange={(e) => updateItem(itemIndex, e.target.value)}
                      className="input flex-1"
                      placeholder={`Item ${itemIndex + 1}`}
                    />

                    <button
                      type="button"
                      onClick={() => removeItem(itemIndex)}
                      className="btn-icon text-red-500 hover:bg-red-50"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addItem}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <FiPlus size={14} />
                  Add Item
                </button>
              </div>
            </BlockField>
          )}

          {block.type === "faq" && (
            <>
              <BlockField label="Question">
                <input
                  value={block.title || ""}
                  onChange={(e) => update("title", e.target.value)}
                  className="input"
                  placeholder="Enter question"
                />
              </BlockField>

              <BlockField label="Answer">
                <textarea
                  value={block.content || ""}
                  onChange={(e) => update("content", e.target.value)}
                  className="input resize-y"
                  rows={4}
                  placeholder="Enter answer..."
                />
              </BlockField>
            </>
          )}

          {block.type === "notice" && (
            <p className="text-xs text-gray-400">
              This block automatically receives the default ONE PIECE notice
              styling on the customer page.
            </p>
          )}

          {block.type === "contact" && (
            <p className="text-xs text-gray-400">
              Enter your contact information in the content field. Styling is
              applied automatically.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CMSBlockEditor({ blocks = [], onChange }) {
  const [localBlocks, setLocalBlocks] = useState(blocks);

  useEffect(() => {
    setLocalBlocks(blocks || []);
  }, [blocks]);

  const updateBlocks = (nextBlocks) => {
    const normalized = nextBlocks.map((block, index) => ({
      ...block,
      order: index,
    }));

    setLocalBlocks(normalized);
    onChange(normalized);
  };

  const addBlock = (type) => {
    updateBlocks([...localBlocks, createBlock(type, localBlocks.length)]);
  };

  const updateBlock = (index, block) => {
    const next = [...localBlocks];
    next[index] = block;
    updateBlocks(next);
  };

  const deleteBlock = (index) => {
    updateBlocks(localBlocks.filter((_, i) => i !== index));
  };

  const duplicateBlock = (index) => {
    const source = localBlocks[index];

    const copy = {
      ...source,
      items: [...(source.items || [])],
    };

    updateBlocks([
      ...localBlocks.slice(0, index + 1),
      copy,
      ...localBlocks.slice(index + 1),
    ]);
  };

  const moveBlock = (index, direction) => {
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= localBlocks.length) {
      return;
    }

    const next = [...localBlocks];

    [next[index], next[newIndex]] = [next[newIndex], next[index]];

    updateBlocks(next);
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-brand-900">Page Sections</h3>

            <p className="text-xs text-gray-400 mt-0.5">
              Build the page using ready-made sections. No HTML required.
            </p>
          </div>

          <span className="text-xs font-medium text-gray-400">
            {localBlocks.length} section
            {localBlocks.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="space-y-3">
          {localBlocks.map((block, index) => (
            <BlockEditor
              key={`${block.type}-${index}`}
              block={block}
              index={index}
              total={localBlocks.length}
              onChange={updateBlock}
              onDelete={deleteBlock}
              onDuplicate={duplicateBlock}
              onMove={moveBlock}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5">
        <p className="text-sm font-semibold text-gray-800 mb-3">Add Section</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BLOCK_TYPES.map((block) => (
            <button
              key={block.type}
              type="button"
              onClick={() => addBlock(block.type)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-left hover:border-brand-300 hover:shadow-sm transition"
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <FiPlus size={13} />
                {block.label}
              </span>

              <span className="block text-[11px] text-gray-400 mt-1 leading-tight">
                {block.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
