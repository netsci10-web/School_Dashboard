import React, { useState } from "react";
import { Category, Todo } from "../types";
import { generateId } from "../utils";

interface TodoModalProps {
  category: Category;
  isAdmin: boolean;
  onClose: () => void;
  onSave: (updatedCategory: Category) => void;
  onOpenAdminLogin: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function TodoModal({
  category,
  isAdmin,
  onClose,
  onSave,
  onOpenAdminLogin,
  showToast
}: TodoModalProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDate, setNewDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todos = category.todos || [];

  // Sort ongoing tasks: no date last, then by date ascending
  const activeTodos = [...todos]
    .filter((t) => !t.completed)
    .sort((a, b) => {
      if (!a.date && !b.date) return (a.timestamp || 0) - (b.timestamp || 0);
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  // Sort completed tasks: newest completed first
  const completedTodos = [...todos]
    .filter((t) => t.completed)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast("할일 내용을 입력하세요.", "error");
      return;
    }

    const newTodo: Todo = {
      id: generateId(),
      title: newTitle.trim(),
      date: newDate || undefined,
      assignee: newAssignee.trim() || undefined,
      completed: false,
      timestamp: Date.now()
    };

    const updatedCategory: Category = {
      ...category,
      todos: [...todos, newTodo]
    };

    setIsSubmitting(true);
    try {
      await onSave(updatedCategory);
      showToast("할일이 등록되었습니다.", "success");
      setNewTitle("");
      setNewAssignee("");
      setNewDate("");
    } catch (err) {
      showToast("할일을 추가하지 못했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTodo = async (todoId: string, currentCompleted: boolean) => {
    const updatedTodos = todos.map((t) => {
      if (t.id === todoId) {
        return { ...t, completed: !currentCompleted, timestamp: Date.now() };
      }
      return t;
    });

    const updatedCategory: Category = {
      ...category,
      todos: updatedTodos
    };

    try {
      await onSave(updatedCategory);
      showToast(currentCompleted ? "할일 진행 중 상태로 변경." : "할일 완료 처리됨.", "success");
    } catch (err) {
      showToast("상태를 변경하지 못했습니다.", "error");
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (!window.confirm("이 할일을 삭제하시겠습니까?")) return;

    const updatedTodos = todos.filter((t) => t.id !== todoId);
    const updatedCategory: Category = {
      ...category,
      todos: updatedTodos
    };

    try {
      await onSave(updatedCategory);
      showToast("할일이 삭제되었습니다.", "success");
    } catch (err) {
      showToast("할일을 삭제하지 못했습니다.", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-[45] flex flex-col h-full w-full overflow-hidden animate-slide-up">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors flex-shrink-0"
            title="돌아가기"
            type="button"
          >
            <i className="fas fa-arrow-left text-lg"></i>
          </button>
          <div className="flex items-center justify-between flex-1 min-w-0">
            <div>
              <h2 className="text-xl font-bold text-gray-800 truncate">{category.title}</h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{category.subtitle || "할일 목록 관리"}</p>
            </div>
            {!isAdmin && (
              <button
                onClick={onOpenAdminLogin}
                className="ml-2 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold border border-amber-200 hover:bg-amber-100 transition-colors shadow-sm flex items-center whitespace-nowrap"
                type="button"
              >
                <i className="fas fa-sign-in-alt mr-1.5"></i>관리자 로그인 (할일 등록)
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          {/* Admin Todo Creator */}
          {isAdmin && (
            <form
              onSubmit={handleAddTodo}
              className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-amber-200 mb-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                <i className="fas fa-plus-circle text-amber-500 mr-2"></i> 새 할일 등록
              </h3>
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  placeholder="할일 내용 (예: 교육과정 계획안 제출)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  disabled={isSubmitting}
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="담당자 (선택)"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full md:w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    disabled={isSubmitting}
                  />
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full md:w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-gray-600"
                    disabled={isSubmitting}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-amber-500 text-white font-bold px-6 py-2 rounded-lg shadow-sm hover:bg-amber-600 transition whitespace-nowrap flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    "추가하기"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* List Section */}
          <div className="space-y-6">
            {/* Ongoing Tasks */}
            <div>
              <h4 className="font-bold text-gray-700 mb-3 flex items-center">
                <i className="fas fa-running text-blue-500 mr-2"></i> 진행 중인 할 일{" "}
                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs ml-2">
                  {activeTodos.length}
                </span>
              </h4>
              <div className="space-y-2">
                {activeTodos.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 bg-white rounded-lg border border-dashed border-gray-300">
                    <i className="fas fa-glass-cheers text-2xl mb-2 block text-gray-300"></i>
                    진행 중인 할 일이 없습니다.
                  </div>
                ) : (
                  activeTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex flex-wrap md:flex-nowrap items-center gap-2 p-3 md:p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleTodo(todo.id, todo.completed)}
                        className="w-5 h-5 text-amber-500 rounded border-gray-300 focus:ring-amber-500 cursor-pointer flex-shrink-0"
                      />
                      <span className="font-medium text-gray-800 flex-1 min-w-0 break-words">
                        {todo.title}
                      </span>
                      <div className="flex items-center gap-2 ml-auto md:ml-4 flex-shrink-0">
                        {todo.assignee && (
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md font-medium border border-gray-200">
                            @{todo.assignee}
                          </span>
                        )}
                        {todo.date && (
                          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                            <i className="far fa-calendar-alt mr-1"></i>
                            {todo.date}
                          </span>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="text-gray-300 hover:text-red-500 ml-1 p-1 transition-colors"
                            type="button"
                            title="삭제"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Completed Tasks */}
            <div>
              <h4 className="font-bold text-gray-500 mb-3 flex items-center">
                <i className="fas fa-check-circle text-gray-400 mr-2"></i> 완료된 할 일{" "}
                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs ml-2">
                  {completedTodos.length}
                </span>
              </h4>
              <div className="space-y-2">
                {completedTodos.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    완료된 항목이 없습니다.
                  </div>
                ) : (
                  completedTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex flex-wrap md:flex-nowrap items-center gap-2 p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm opacity-60 hover:opacity-100 transition-opacity group"
                    >
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleTodo(todo.id, todo.completed)}
                        className="w-5 h-5 text-gray-400 rounded border-gray-300 cursor-pointer flex-shrink-0"
                      />
                      <span className="font-medium text-gray-500 line-through flex-1 min-w-0 break-words">
                        {todo.title}
                      </span>
                      <div className="flex items-center gap-2 ml-auto md:ml-4 flex-shrink-0">
                        {todo.assignee && (
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-md">
                            @{todo.assignee}
                          </span>
                        )}
                        {todo.date && (
                          <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded-md">
                            <i className="far fa-calendar-alt mr-1"></i>
                            {todo.date}
                          </span>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="text-gray-300 hover:text-red-500 ml-1 p-1 transition-colors"
                            type="button"
                            title="삭제"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
