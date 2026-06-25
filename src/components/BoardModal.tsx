import React, { useState, useEffect } from "react";
import { Category, Post } from "../types";
import { generateId } from "../utils";

interface BoardModalProps {
  category: Category;
  isAdmin: boolean;
  onClose: () => void;
  onSave: (updatedCategory: Category) => void;
  onOpenAdminLogin: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
  initialPostId: string | null;
  onClearInitialPostId: () => void;
}

type ViewMode = "list" | "read" | "write" | "edit";

export default function BoardModal({
  category,
  isAdmin,
  onClose,
  onSave,
  onOpenAdminLogin,
  showToast,
  initialPostId,
  onClearInitialPostId
}: BoardModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Form state for Write / Edit
  const [writeTitle, setWriteTitle] = useState("");
  const [writeAuthor, setWriteAuthor] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const posts = category.posts || [];

  // Open initial post if directed
  useEffect(() => {
    if (initialPostId) {
      const postExists = posts.some((p) => p.id === initialPostId);
      if (postExists) {
        setSelectedPostId(initialPostId);
        setViewMode("read");
        // Update view count safely
        const updatedPosts = posts.map((p) => {
          if (p.id === initialPostId) {
            return { ...p, views: (p.views || 0) + 1 };
          }
          return p;
        });
        onSave({ ...category, posts: updatedPosts });
      }
      onClearInitialPostId();
    }
  }, [initialPostId, posts, category, onSave, onClearInitialPostId]);

  // Filter posts by search query
  const filteredPosts = [...posts]
    .sort((a, b) => (b.timestamp || new Date(b.date).getTime()) - (a.timestamp || new Date(a.date).getTime()))
    .filter((post) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(q) ||
        post.author.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q)
      );
    });

  // Pagination calculations
  const itemsPerPage = 10;
  const totalItems = filteredPosts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInputValue);
    setCurrentPage(1);
  };

  const handleOpenPost = (post: Post) => {
    setSelectedPostId(post.id);
    setViewMode("read");

    // Increment view count
    const updatedPosts = posts.map((p) => {
      if (p.id === post.id) {
        return { ...p, views: (p.views || 0) + 1 };
      }
      return p;
    });
    onSave({ ...category, posts: updatedPosts });
  };

  const handleOpenWrite = () => {
    setWriteTitle("");
    setWriteAuthor("");
    setWriteContent("");
    setViewMode("write");
  };

  const handleOpenEdit = (post: Post) => {
    setWriteTitle(post.title);
    setWriteAuthor(post.author);
    setWriteContent(post.content);
    setViewMode("edit");
  };

  const handleSavePost = async () => {
    if (!writeTitle.trim() || !writeContent.trim()) {
      showToast("제목과 내용을 모두 입력해주세요.", "error");
      return;
    }

    setIsSubmitting(true);
    let updatedPosts = [...posts];

    if (viewMode === "edit" && selectedPostId) {
      updatedPosts = updatedPosts.map((p) => {
        if (p.id === selectedPostId) {
          return {
            ...p,
            title: writeTitle.trim(),
            author: writeAuthor.trim() || "관리자",
            content: writeContent.trim()
          };
        }
        return p;
      });
    } else {
      // New post
      const newPost: Post = {
        id: generateId(),
        title: writeTitle.trim(),
        author: writeAuthor.trim() || "관리자",
        date: new Date().toISOString().slice(0, 10),
        timestamp: Date.now(),
        views: 0,
        content: writeContent.trim(),
        isNew: true
      };
      updatedPosts.unshift(newPost);
    }

    try {
      await onSave({ ...category, posts: updatedPosts });
      showToast(viewMode === "edit" ? "게시글이 수정되었습니다." : "게시글이 등록되었습니다.", "success");
      setViewMode("list");
      setSelectedPostId(null);
    } catch (err) {
      showToast("게시글을 저장하지 못했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("이 게시글을 삭제하시겠습니까?")) return;

    const updatedPosts = posts.filter((p) => p.id !== postId);
    try {
      await onSave({ ...category, posts: updatedPosts });
      showToast("게시글이 삭제되었습니다.", "success");
      setViewMode("list");
      setSelectedPostId(null);
    } catch (err) {
      showToast("게시글을 삭제하지 못했습니다.", "error");
    }
  };

  // Find active post details
  const activePost = posts.find((p) => p.id === selectedPostId);

  return (
    <div className="fixed inset-0 bg-gray-50 z-[45] flex flex-col h-full w-full overflow-hidden animate-slide-up">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => {
              if (viewMode === "read" || viewMode === "write" || viewMode === "edit") {
                setViewMode("list");
                setSelectedPostId(null);
              } else {
                onClose();
              }
            }}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors flex-shrink-0"
            title="돌아가기"
            type="button"
          >
            <i className="fas fa-arrow-left text-lg"></i>
          </button>
          <div className="flex items-center justify-between flex-1 min-w-0">
            <div>
              <h2 className="text-xl font-bold text-gray-800 truncate">{category.title}</h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{category.subtitle || "게시판 안내"}</p>
            </div>
            {!isAdmin && (viewMode === "list" || viewMode === "read") && (
              <button
                onClick={onOpenAdminLogin}
                className="ml-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm flex items-center whitespace-nowrap"
                type="button"
              >
                <i className="fas fa-sign-in-alt mr-1.5"></i>관리자 로그인 (글쓰기)
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          {viewMode === "list" && (
            <>
              {/* Filter and search bar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 px-2">
                <div className="text-sm text-gray-600">
                  전체 <strong className="text-teal-600">{totalItems}</strong>건 ({currentPage} / {totalPages})
                </div>
                <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
                  <select className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white outline-none">
                    <option value="all">제목+부서+내용</option>
                  </select>
                  <div className="relative flex-1 md:w-64">
                    <input
                      type="text"
                      placeholder="검색어를 입력하세요."
                      value={searchInputValue}
                      onChange={(e) => setSearchInputValue(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-teal-500"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1.5 text-gray-400 hover:text-teal-600"
                    >
                      <i className="fas fa-search"></i>
                    </button>
                  </div>
                </form>
              </div>

              {/* Table list */}
              <div className="bg-white border-t-2 border-gray-800 border-b border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-2 p-3 bg-gray-50 text-sm font-bold text-center border-b border-gray-200">
                  <div className="col-span-1">순번</div>
                  <div className="col-span-7 text-left pl-4">제목</div>
                  <div className="col-span-2">부서명</div>
                  <div className="col-span-1">등록일</div>
                  <div className="col-span-1">조회수</div>
                </div>
                <div className="divide-y divide-gray-100">
                  {paginatedPosts.length > 0 ? (
                    paginatedPosts.map((post, index) => {
                      const postNum = totalItems - startIndex - index;
                      return (
                        <div
                          key={post.id}
                          onClick={() => handleOpenPost(post)}
                          className="flex flex-col md:grid md:grid-cols-12 gap-2 p-3 hover:bg-gray-50 transition-colors text-sm items-center cursor-pointer group"
                        >
                          <div className="hidden md:block col-span-1 text-center text-gray-500">{postNum}</div>
                          <div className="w-full md:col-span-7 text-left font-medium text-gray-800 truncate px-2 group-hover:text-teal-700 transition-colors">
                            {post.title}
                            {post.isNew && (
                              <span className="inline-flex items-center justify-center w-4 h-4 ml-2 bg-teal-500 text-white text-[10px] rounded-full font-bold">
                                N
                              </span>
                            )}
                          </div>
                          <div className="w-full md:col-span-4 flex justify-between md:contents text-xs md:text-sm text-gray-500">
                            <div className="md:col-span-2 md:text-center truncate px-2 text-gray-600">
                              <span className="md:hidden font-bold mr-1 text-gray-400">부서:</span>
                              {post.author}
                            </div>
                            <div className="md:col-span-1 md:text-center whitespace-nowrap">{post.date}</div>
                            <div className="md:col-span-1 md:text-center">
                              <span className="md:hidden font-bold mr-1 text-gray-400">조회:</span>
                              {post.views || 0}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-10 text-center text-gray-500">등록된 게시글이 없습니다.</div>
                  )}
                </div>
              </div>

              {/* Bottom control */}
              <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 px-2">
                <div className="w-full md:w-auto invisible md:visible flex-1"></div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center border rounded bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                  >
                    <i className="fas fa-angle-double-left text-xs"></i>
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center border rounded bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                  >
                    <i className="fas fa-angle-left text-xs"></i>
                  </button>
                  <div className="flex gap-1 px-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = currentPage > 3 ? currentPage - 2 + i : i + 1;
                      if (pageNum > totalPages) return null;
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center border rounded ${
                            isActive
                              ? "bg-white border-teal-500 text-teal-600 font-bold"
                              : "bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center border rounded bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                  >
                    <i className="fas fa-angle-right text-xs"></i>
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center border rounded bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                  >
                    <i className="fas fa-angle-double-right text-xs"></i>
                  </button>
                </div>
                <div className="w-full md:w-auto flex-1 flex justify-end">
                  {isAdmin && (
                    <button
                      onClick={handleOpenWrite}
                      className="px-5 py-2 bg-teal-600 text-white font-bold rounded shadow hover:bg-teal-700 transition-colors w-full md:w-auto"
                      type="button"
                    >
                      글쓰기
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {viewMode === "read" && activePost && (
            <div className="bg-white border-t-2 border-gray-800 rounded-lg shadow-sm overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{activePost.title}</h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div>
                    <i className="fas fa-sitemap mr-1"></i> {activePost.author}
                  </div>
                  <div>
                    <i className="far fa-clock mr-1"></i> {activePost.date}
                  </div>
                  <div>
                    <i className="far fa-eye mr-1"></i> {activePost.views || 0}
                  </div>
                </div>
              </div>
              <div className="p-6 md:p-8 min-h-[300px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                {activePost.content}
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <button
                  onClick={() => {
                    setViewMode("list");
                    setSelectedPostId(null);
                  }}
                  className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-bold shadow-sm transition"
                >
                  목록으로
                </button>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(activePost)}
                      className="px-5 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-600 hover:text-white transition-all font-bold shadow-sm"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeletePost(activePost.id)}
                      className="px-5 py-2 bg-red-50 text-red-500 border border-red-200 rounded hover:bg-red-600 hover:text-white transition-all font-bold shadow-sm"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {(viewMode === "write" || viewMode === "edit") && (
            <div className="bg-white border-t-2 border-teal-600 rounded-lg shadow-sm overflow-hidden p-6 animate-fade-in">
              <h3 className="text-lg md:text-xl font-bold mb-5 pb-3 border-b border-gray-100">
                {viewMode === "edit" ? "게시글 수정" : "게시글 작성"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">제목</label>
                  <input
                    type="text"
                    value={writeTitle}
                    onChange={(e) => setWriteTitle(e.target.value)}
                    className="w-full border rounded p-2.5 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm"
                    placeholder="제목을 입력하세요."
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">부서명 (작성자)</label>
                  <input
                    type="text"
                    value={writeAuthor}
                    onChange={(e) => setWriteAuthor(e.target.value)}
                    className="w-full md:w-1/2 border rounded p-2.5 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm"
                    placeholder="부서 또는 담당자 이름"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">내용</label>
                  <textarea
                    rows={12}
                    value={writeContent}
                    onChange={(e) => setWriteContent(e.target.value)}
                    className="w-full border rounded p-2.5 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm leading-relaxed"
                    placeholder="업무 지시, 안내 사항 등 세부 내용을 상세히 적어주세요."
                    disabled={isSubmitting}
                  ></textarea>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  onClick={() => {
                    if (viewMode === "edit" && selectedPostId) {
                      setViewMode("read");
                    } else {
                      setViewMode("list");
                    }
                  }}
                  className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-bold"
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  onClick={handleSavePost}
                  className="px-5 py-2 bg-teal-600 text-white font-bold rounded shadow hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : viewMode === "edit" ? (
                    "수정하기"
                  ) : (
                    "등록하기"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
