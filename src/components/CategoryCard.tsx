import React, { useState } from "react";
import { Category, Group, LinkItem, Post, Todo } from "../types";
import { palette, formatUrl } from "../utils";

interface CategoryCardProps {
  key?: string | number;
  category: Category;
  index: number;
  isMasterUnlocked: boolean;
  unlockedEntities: Set<string>;
  onCategoryClick: (e: React.MouseEvent, catId: string) => void;
  onGroupClick: (e: React.MouseEvent, catId: string, groupIdx: number) => void;
  onItemClick: (e: React.MouseEvent, catId: string, groupIdx: number, itemIdx: number) => void;
  onPostClick: (catId: string, postId: string) => void;
  onCheckTodoMain: (catId: string, todoId: string) => void;
  columns: number;
}

export default function CategoryCard({
  category,
  index,
  isMasterUnlocked,
  unlockedEntities,
  onCategoryClick,
  onGroupClick,
  onItemClick,
  onPostClick,
  onCheckTodoMain,
  columns
}: CategoryCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({});
  const [checkingTodos, setCheckingTodos] = useState<{ [key: string]: boolean }>({});

  const colors = palette[category.color] || palette.blue;

  // Determine if entity is locked
  const isCatLocked = !!(category.password && category.password.trim());
  const isCatUnlockedState = isMasterUnlocked || unlockedEntities.has(category.id);

  // Layout span
  const safeColSpan = Math.min(category.colSpan || 1, columns);
  const mdColSpan = Math.min(safeColSpan, 2);
  const colSpanClass =
    (category.type === "board" || category.type === "todo") && safeColSpan > 1
      ? `md:col-span-${mdColSpan} lg:col-span-${safeColSpan}`
      : "";

  const toggleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    if (category.link && category.link.trim() !== "#") {
      window.open(formatUrl(category.link), "_blank");
      return;
    }
    setIsOpen(!isOpen);
  };

  const toggleGroupOpen = (e: React.MouseEvent, groupIdx: number, group: Group) => {
    e.preventDefault();
    const gId = `${category.id}-grp-${groupIdx}`;
    if (group.link && group.link.trim() !== "#") {
      window.open(formatUrl(group.link), "_blank");
      return;
    }
    setOpenGroups((prev) => ({ ...prev, [gId]: !prev[gId] }));
  };

  const handleTodoCheck = (todoId: string) => {
    setCheckingTodos((prev) => ({ ...prev, [todoId]: true }));
    // Wait for animation to finish then propagate change
    setTimeout(() => {
      onCheckTodoMain(category.id, todoId);
      // Clean up local checking state
      setCheckingTodos((prev) => {
        const next = { ...prev };
        delete next[todoId];
        return next;
      });
    }, 600);
  };

  // Render Type: BOARD card
  if (category.type === "board") {
    const latestPosts = [...(category.posts || [])]
      .sort(
        (a, b) =>
          (b.timestamp || new Date(b.date).getTime()) -
          (a.timestamp || new Date(a.date).getTime())
      )
      .slice(0, 5);

    return (
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 flex flex-col ${colSpanClass} animate-fade-in`}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <button
          onClick={(e) => onCategoryClick(e, category.id)}
          className="w-full p-4 md:p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 rounded-t-xl"
        >
          <div className="flex items-center min-w-0 flex-1 pr-2">
            <div
              className={`w-10 h-10 md:w-12 md:h-12 flex-shrink-0 ${colors.bg} rounded-full flex items-center justify-center mr-3 md:mr-4`}
            >
              <i className={`fas ${category.icon} ${colors.text} text-lg md:text-xl`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-bold text-gray-800 flex items-center truncate">
                {category.title}
                <span className="ml-3 px-2.5 py-1 bg-blue-500 text-white rounded-lg text-[10px] md:text-xs font-bold shadow-sm flex items-center whitespace-nowrap">
                  <i className="fas fa-clipboard-list mr-1"></i>게시판 가기
                </span>
                {isCatLocked && (
                  <span className="ml-1.5">
                    {isCatUnlockedState ? (
                      <i className="fas fa-lock-open text-emerald-400 text-sm" title="잠금 해제됨"></i>
                    ) : (
                      <i className="fas fa-lock text-gray-300 text-sm" title="암호 보호됨"></i>
                    )}
                  </span>
                )}
              </h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1 truncate">{category.subtitle}</p>
            </div>
          </div>
          <i className="fas fa-chevron-right text-gray-400 flex-shrink-0"></i>
        </button>

        {/* Board Latest Posts */}
        <div className="border-t border-gray-100 bg-gray-50/50 rounded-b-xl overflow-hidden flex-1 flex flex-col justify-end">
          {latestPosts.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {latestPosts.map((post) => (
                <li
                  key={post.id}
                  onClick={() => onPostClick(category.id, post.id)}
                  className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors group"
                >
                  <div className="flex items-center min-w-0 flex-1">
                    <i className="fas fa-angle-right text-gray-300 mr-2 text-[10px] group-hover:text-blue-400 transition-colors flex-shrink-0"></i>
                    <span className="truncate text-xs md:text-sm text-gray-600 group-hover:text-blue-700 transition-colors font-medium">
                      {post.title}
                    </span>
                    {post.isNew && (
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 ml-1.5 bg-teal-500 text-white text-[8px] rounded-full font-bold flex-shrink-0">
                        N
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 ml-3 flex-shrink-0 hidden md:block">
                    {post.author}
                  </span>
                  <span className="text-[10px] text-gray-400 ml-3 flex-shrink-0">
                    {post.date.substring(5)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-4 text-center text-xs text-gray-400">등록된 게시물이 없습니다.</div>
          )}
        </div>
      </div>
    );
  }

  // Render Type: TODO card
  if (category.type === "todo") {
    const uncompletedTodos = [...(category.todos || [])]
      .filter((t) => !t.completed)
      .sort((a, b) => {
        if (!a.date && !b.date) return (a.timestamp || 0) - (b.timestamp || 0);
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

    return (
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 flex flex-col ${colSpanClass} animate-fade-in`}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <button
          onClick={(e) => onCategoryClick(e, category.id)}
          className="w-full p-4 md:p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 rounded-t-xl"
        >
          <div className="flex items-center min-w-0 flex-1 pr-2">
            <div
              className={`w-10 h-10 md:w-12 md:h-12 flex-shrink-0 ${colors.bg} rounded-full flex items-center justify-center mr-3 md:mr-4`}
            >
              <i className={`fas ${category.icon} ${colors.text} text-lg md:text-xl`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-bold text-gray-800 flex items-center truncate">
                {category.title}
                <span className="ml-3 px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[10px] md:text-xs font-bold shadow-sm flex items-center whitespace-nowrap">
                  <i className="fas fa-check-square mr-1"></i>할일 관리
                </span>
                {isCatLocked && (
                  <span className="ml-1.5">
                    {isCatUnlockedState ? (
                      <i className="fas fa-lock-open text-emerald-400 text-sm" title="잠금 해제됨"></i>
                    ) : (
                      <i className="fas fa-lock text-gray-300 text-sm" title="암호 보호됨"></i>
                    )}
                  </span>
                )}
              </h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1 truncate">{category.subtitle}</p>
            </div>
          </div>
          <i className="fas fa-chevron-right text-gray-400 flex-shrink-0"></i>
        </button>

        {/* Uncompleted Checklist */}
        <div className="border-t border-gray-100 bg-amber-50/20 rounded-b-xl overflow-hidden p-3 md:p-4 space-y-2">
          {uncompletedTodos.length > 0 ? (
            uncompletedTodos.map((todo) => {
              const isChecking = checkingTodos[todo.id];
              return (
                <div
                  key={todo.id}
                  className={`flex items-center gap-2.5 p-3 border border-gray-200 rounded-lg shadow-sm transition-all duration-500 ease-in-out ${
                    isChecking ? "opacity-40 bg-gray-100 scale-95" : "bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecking}
                    onChange={() => handleTodoCheck(todo.id)}
                    className="w-4 h-4 md:w-5 md:h-5 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer flex-shrink-0 shadow-sm"
                  />
                  <span
                    className={`font-medium text-gray-700 text-xs md:text-sm flex-1 truncate transition-all duration-300 ${
                      isChecking ? "line-through text-gray-400" : ""
                    }`}
                  >
                    {todo.title}
                  </span>
                  {todo.assignee && (
                    <span className="text-[10px] md:text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 whitespace-nowrap flex-shrink-0 font-medium">
                      @{todo.assignee}
                    </span>
                  )}
                  {todo.date && (
                    <span className="text-[10px] md:text-xs text-gray-400 whitespace-nowrap flex-shrink-0 ml-1">
                      <i className="far fa-calendar-alt mr-1"></i>
                      {todo.date}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-4 py-6 text-center text-xs md:text-sm text-gray-400">
              <i className="fas fa-glass-cheers text-xl mb-1.5 block text-gray-300 animate-pulse"></i>
              남은 할 일이 없습니다!
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Type: MENU folders card
  const hasLink = category.link && category.link.trim() !== "" && category.link.trim() !== "#";
  const hasGroups = category.groups && category.groups.length > 0;

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        onClick={(e) => {
          if (isCatLocked && !isCatUnlockedState) {
            onCategoryClick(e, category.id);
          } else if (hasLink) {
            window.open(formatUrl(category.link!), "_blank");
          } else {
            toggleOpen(e);
          }
        }}
        className="w-full p-4 md:p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 rounded-t-xl cursor-pointer"
      >
        <div className="flex items-center min-w-0 flex-1 pr-2">
          <div
            className={`w-10 h-10 md:w-12 md:h-12 flex-shrink-0 ${colors.bg} rounded-full flex items-center justify-center mr-3 md:mr-4`}
          >
            <i className={`fas ${category.icon} ${colors.text} text-lg md:text-xl`}></i>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-bold text-gray-800 flex items-center truncate">
              {category.title}
              {isCatLocked && (
                <span className="ml-1.5">
                  {isCatUnlockedState ? (
                    <i className="fas fa-lock-open text-emerald-400 text-sm" title="잠금 해제됨"></i>
                  ) : (
                    <i className="fas fa-lock text-gray-300 text-sm" title="암호 보호됨"></i>
                  )}
                </span>
              )}
            </h3>
            <p className="text-xs md:text-sm text-gray-500 mt-1 truncate">{category.subtitle}</p>
          </div>
        </div>
        {hasLink ? (
          <i className="fas fa-external-link-alt text-gray-400 text-sm flex-shrink-0"></i>
        ) : hasGroups ? (
          <i
            className={`fas fa-chevron-down text-gray-400 transition-transform duration-300 flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
          ></i>
        ) : null}
      </div>

      {/* Accordion groups drawer */}
      {!hasLink && hasGroups && isOpen && (
        <div className="border-t border-gray-50 bg-white rounded-b-xl overflow-hidden transition-all duration-300">
          <div className="p-3 md:p-4 max-h-[400px] overflow-y-auto custom-scrollbar bg-slate-50/50 space-y-3">
            {category.groups!.map((group, gIdx) => {
              const gColors = palette[group.color] || palette.gray;
              const gId = `${category.id}-grp-${gIdx}`;
              const isGroupLocked = !!(group.password && group.password.trim());
              const isGroupUnlockedState = isMasterUnlocked || unlockedEntities.has(gId);

              const gHasLink = group.link && group.link.trim() !== "" && group.link.trim() !== "#";
              const gHasItems = group.items && group.items.length > 0;
              const isGroupOpen = !!openGroups[gId];

              return (
                <div key={gId} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div
                    onClick={(e) => {
                      if (isGroupLocked && !isGroupUnlockedState) {
                        onGroupClick(e, category.id, gIdx);
                      } else if (gHasLink) {
                        window.open(formatUrl(group.link!), "_blank");
                      } else {
                        toggleGroupOpen(e, gIdx, group);
                      }
                    }}
                    className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center min-w-0 flex-1 pr-2">
                      <div
                        className={`w-7 h-7 md:w-8 md:h-8 flex-shrink-0 ${gColors.bg} rounded-md flex items-center justify-center mr-2 md:mr-3`}
                      >
                        <i className={`fas ${group.icon} ${gColors.text} text-xs md:text-sm`}></i>
                      </div>
                      <h4 className="font-bold text-gray-700 text-xs md:text-sm flex items-center truncate">
                        {group.title}
                        {isGroupLocked && (
                          <span className="ml-1.5">
                            {isGroupUnlockedState ? (
                              <i className="fas fa-lock-open text-emerald-400 text-[10px]" title="잠금 해제됨"></i>
                            ) : (
                              <i className="fas fa-lock text-gray-300 text-[10px]" title="암호 보호됨"></i>
                            )}
                          </span>
                        )}
                      </h4>
                    </div>
                    {gHasLink ? (
                      <i className="fas fa-external-link-alt text-gray-400 text-xs flex-shrink-0"></i>
                    ) : gHasItems ? (
                      <i
                        className={`fas fa-chevron-down text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                          isGroupOpen ? "rotate-180" : ""
                        }`}
                      ></i>
                    ) : null}
                  </div>

                  {/* Group Items drawer */}
                  {!gHasLink && gHasItems && isGroupOpen && (
                    <div className="bg-white border-t border-gray-50 py-1.5 px-2 space-y-1 transition-all">
                      {group.items.map((item, iIdx) => {
                        const itemId = `${category.id}-grp-${gIdx}-item-${iIdx}`;
                        const isItemLocked = !!(item.password && item.password.trim());
                        const isItemUnlockedState = isMasterUnlocked || unlockedEntities.has(itemId);

                        return (
                          <a
                            key={itemId}
                            href={formatUrl(item.link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => onItemClick(e, category.id, gIdx, iIdx)}
                            className="block p-2 bg-white border border-gray-100 rounded hover:bg-slate-50 hover:border-slate-300 transition-colors text-xs md:text-sm text-gray-600 flex items-center group/item"
                          >
                            <i className="fas fa-file-alt mr-2 text-gray-400 group-hover/item:text-blue-500 transition-colors flex-shrink-0"></i>
                            <span className="flex-1 min-w-0 truncate font-medium flex items-center">
                              {item.title}
                              {isItemLocked && (
                                <span className="ml-1.5">
                                  {isItemUnlockedState ? (
                                    <i className="fas fa-lock-open text-emerald-400 text-[9px]" title="잠금 해제됨"></i>
                                  ) : (
                                    <i className="fas fa-lock text-gray-300 text-[9px]" title="암호 보호됨"></i>
                                  )}
                                </span>
                              )}
                            </span>
                            <i className="fas fa-external-link-alt ml-auto pl-2 text-[10px] md:text-xs text-gray-300 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0"></i>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
