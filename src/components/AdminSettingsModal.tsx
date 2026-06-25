import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { AppState, Category, Group, QuickLink, LinkItem } from "../types";
import { palette, colorNames, iconList, generateId } from "../utils";

interface AdminSettingsModalProps {
  appState: AppState;
  onClose: () => void;
  onSave: (newState: AppState) => Promise<void>;
  onLogout: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
  currentSiteId: string;
}

export default function AdminSettingsModal({
  appState,
  onClose,
  onSave,
  onLogout,
  showToast,
  currentSiteId
}: AdminSettingsModalProps) {
  // We make a draft copy of the state to edit locally
  const [draft, setDraft] = useState<AppState>(() => JSON.parse(JSON.stringify(appState)));
  const [collapsedCategories, setCollapsedCategories] = useState<{ [key: string]: boolean }>(() => {
    // Collapse all categories by default
    const initial: { [key: string]: boolean } = { quickLinks: true };
    appState.categories.forEach((c) => {
      initial[c.id] = true;
    });
    return initial;
  });
  const [isSaving, setIsSaving] = useState(false);

  // States for Site Basic Info Settings
  const [siteName, setSiteName] = useState("");
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loadingSiteInfo, setLoadingSiteInfo] = useState(false);

  useEffect(() => {
    if (!currentSiteId) return;

    const fetchSiteInfo = async () => {
      try {
        setLoadingSiteInfo(true);
        // 1. Fetch site name & admin ID
        const desksRef = doc(db, "school_settings", "admin_desks");
        const desksSnap = await getDoc(desksRef);
        if (desksSnap.exists()) {
          const desksData = desksSnap.data();
          const list = desksData.desks || [];
          const matched = list.find((d: any) => d.siteID === currentSiteId);
          if (matched) {
            setSiteName(matched.siteName || "");
            setAdminId(matched.adminId || "");
          }
        }

        // 2. Fetch admin password
        const credRef = doc(db, "school_settings", "admin_credentials");
        const credSnap = await getDoc(credRef);
        if (credSnap.exists()) {
          const credData = credSnap.data();
          const list = credData.credentials || [];
          const matched = list.find((c: any) => c.siteID === currentSiteId);
          if (matched) {
            setAdminPassword(matched.adminPassword || "");
          }
        }
      } catch (err) {
        console.error("Failed to load current site settings:", err);
      } finally {
        setLoadingSiteInfo(false);
      }
    };

    fetchSiteInfo();
  }, [currentSiteId]);

  const toggleCollapse = (id: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollToCategory = (id: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [id]: false }));
    setTimeout(() => {
      const el = document.getElementById(`setting-cat-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleUpdateField = <K extends keyof AppState>(key: K, value: AppState[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  // --- Category Actions ---
  const handleUpdateCat = (catId: string, field: keyof Category, value: any) => {
    setDraft((prev) => {
      const nextCats = prev.categories.map((c) => {
        if (c.id === catId) {
          return { ...c, [field]: value };
        }
        return c;
      });
      return { ...prev, categories: nextCats };
    });
  };

  const handleAddCategory = () => {
    const newId = generateId();
    const newCat: Category = {
      id: newId,
      type: "menu",
      title: "새 메뉴",
      subtitle: "",
      icon: "fa-folder",
      color: "blue",
      password: "",
      link: "",
      colSpan: 1,
      groups: [],
      posts: [],
      todos: []
    };

    setDraft((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat]
    }));
    setCollapsedCategories((prev) => ({ ...prev, [newId]: false }));
    showToast("새 메인메뉴가 추가되었습니다.", "success");
    setTimeout(() => {
      document.getElementById(`setting-cat-${newId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleRemoveCategory = (catId: string) => {
    if (!window.confirm("이 메인메뉴와 포함된 모든 데이터가 영구히 삭제됩니다. 정말 삭제하시겠습니까?")) return;
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== catId)
    }));
    showToast("메인메뉴가 삭제되었습니다.", "success");
  };

  const handleMoveCategoryUp = (idx: number) => {
    if (idx === 0) return;
    setDraft((prev) => {
      const next = [...prev.categories];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      return { ...prev, categories: next };
    });
  };

  const handleMoveCategoryDown = (idx: number) => {
    if (idx === draft.categories.length - 1) return;
    setDraft((prev) => {
      const next = [...prev.categories];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      return { ...prev, categories: next };
    });
  };

  // --- QuickLinks Actions ---
  const handleAddQuickLink = () => {
    const newQl: QuickLink = {
      id: generateId(),
      title: "새 퀵링크",
      icon: "fa-external-link-alt",
      color: "pink",
      link: "https://"
    };
    setDraft((prev) => ({
      ...prev,
      quickLinks: [...prev.quickLinks, newQl]
    }));
  };

  const handleUpdateQuickLink = (id: string, field: keyof QuickLink, value: string) => {
    setDraft((prev) => {
      const nextQls = prev.quickLinks.map((q) => {
        if (q.id === id) {
          return { ...q, [field]: value };
        }
        return q;
      });
      return { ...prev, quickLinks: nextQls };
    });
  };

  const handleRemoveQuickLink = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.filter((q) => q.id !== id)
    }));
  };

  const handleMoveQuickLinkUp = (idx: number) => {
    if (idx === 0) return;
    setDraft((prev) => {
      const next = [...prev.quickLinks];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      return { ...prev, quickLinks: next };
    });
  };

  const handleMoveQuickLinkDown = (idx: number) => {
    if (idx === draft.quickLinks.length - 1) return;
    setDraft((prev) => {
      const next = [...prev.quickLinks];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      return { ...prev, quickLinks: next };
    });
  };

  // --- Group Folder Actions ---
  const handleAddGroup = (catId: string) => {
    const newGrp: Group = {
      id: generateId(),
      title: "새 그룹",
      icon: "fa-folder",
      color: "gray",
      password: "",
      link: "",
      items: []
    };

    setDraft((prev) => {
      const nextCats = prev.categories.map((c) => {
        if (c.id === catId) {
          return { ...c, groups: [...(c.groups || []), newGrp] };
        }
        return c;
      });
      return { ...prev, categories: nextCats };
    });
  };

  const handleUpdateGroup = (catId: string, grpId: string, field: keyof Group, value: any) => {
    setDraft((prev) => {
      const nextCats = prev.categories.map((c) => {
        if (c.id === catId) {
          const nextGrps = (c.groups || []).map((g) => {
            if (g.id === grpId) {
              return { ...g, [field]: value };
            }
            return g;
          });
          return { ...c, groups: nextGrps };
        }
        return c;
      });
      return { ...prev, categories: nextCats };
    });
  };

  const handleRemoveGroup = (catId: string, grpId: string) => {
    if (!window.confirm("이 그룹과 포함된 하위 링크들이 모두 삭제됩니다. 정말 삭제하시겠습니까?")) return;
    setDraft((prev) => {
      const nextCats = prev.categories.map((c) => {
        if (c.id === catId) {
          return { ...c, groups: (c.groups || []).filter((g) => g.id !== grpId) };
        }
        return c;
      });
      return { ...prev, categories: nextCats };
    });
  };

  const handleMoveGroupUp = (catId: string, idx: number) => {
    if (idx === 0) return;
    setDraft((prev) => {
      const nextCats = prev.categories.map((c) => {
        if (c.id === catId && c.groups) {
          const nextGrps = [...c.groups];
          const temp = nextGrps[idx - 1];
          nextGrps[idx - 1] = nextGrps[idx];
          nextGrps[idx] = temp;
          return { ...c, groups: nextGrps };
        }
        return c;
      });
      return { ...prev, categories: nextCats };
    });
  };

  const handleMoveGroupDown = (catId: string, idx: number) => {
    setDraft((prev) => {
      const nextCats = prev.categories.map((c) => {
        if (c.id === catId && c.groups && idx < c.groups.length - 1) {
          const nextGrps = [...c.groups];
          const temp = nextGrps[idx + 1];
          nextGrps[idx + 1] = nextGrps[idx];
          nextGrps[idx] = temp;
          return { ...c, groups: nextGrps };
        }
        return c;
      });
      return { ...prev, categories: nextCats };
    });
  };

  // --- Sub link (item) Actions ---
  const handleAddItem = (catId: string, grpId: string) => {
    const newItem: LinkItem = {
      title: "",
      link: "#",
      password: ""
    };

    setDraft((prev) => {
      const nextCats = prev.categories.map((c) => {
        if (c.id === catId) {
          const nextGrps = (c.groups || []).map((g) => {
            if (g.id === grpId) {
              return { ...g, items: [...(g.items || []), newItem] };
            }
            return g;
          });
          return { ...c, groups: nextGrps };
        }
        return c;
      });
      return { ...prev, categories: nextCats };
    });
  };

  const handleUpdateItem = (catId: string, grpId: string, itemIdx: number, field: keyof LinkItem, value: string) => {
    setDraft((prev) => {
      const nextCats = prev.categories.map((c) => {
        if (c.id === catId) {
          const nextGrps = (c.groups || []).map((g) => {
            if (g.id === grpId) {
              const nextItems = g.items.map((item, idx) => {
                if (idx === itemIdx) {
                  return { ...item, [field]: value };
                }
                return item;
              });
              return { ...g, items: nextItems };
            }
            return g;
          });
          return { ...c, groups: nextGrps };
        }
        return c;
      });
      return { ...prev, categories: nextCats };
    });
  };

  const handleRemoveItem = (catId: string, grpId: string, itemIdx: number) => {
    if (!window.confirm("이 링크를 삭제하시겠습니까?")) return;
    setDraft((prev) => {
      const nextCats = prev.categories.map((c) => {
        if (c.id === catId) {
          const nextGrps = (c.groups || []).map((g) => {
            if (g.id === grpId) {
              return { ...g, items: g.items.filter((_, idx) => idx !== itemIdx) };
            }
            return g;
          });
          return { ...c, groups: nextGrps };
        }
        return c;
      });
      return { ...prev, categories: nextCats };
    });
  };

  const handleMoveItemUp = (catId: string, grpId: string, idx: number) => {
    if (idx === 0) return;
    setDraft((prev) => {
      const nextCats = prev.categories.map((c) => {
        if (c.id === catId) {
          const nextGrps = (c.groups || []).map((g) => {
            if (g.id === grpId) {
              const nextItems = [...g.items];
              const temp = nextItems[idx - 1];
              nextItems[idx - 1] = nextItems[idx];
              nextItems[idx] = temp;
              return { ...g, items: nextItems };
            }
            return g;
          });
          return { ...c, groups: nextGrps };
        }
        return c;
      });
      return { ...prev, categories: nextCats };
    });
  };

  const handleMoveItemDown = (catId: string, grpId: string, idx: number) => {
    setDraft((prev) => {
      const nextCats = prev.categories.map((c) => {
        if (c.id === catId) {
          const nextGrps = (c.groups || []).map((g) => {
            if (g.id === grpId && idx < g.items.length - 1) {
              const nextItems = [...g.items];
              const temp = nextItems[idx + 1];
              nextItems[idx + 1] = nextItems[idx];
              nextItems[idx] = temp;
              return { ...g, items: nextItems };
            }
            return g;
          });
          return { ...c, groups: nextGrps };
        }
        return c;
      });
      return { ...prev, categories: nextCats };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Save standard app state
      await onSave(draft);

      // 2. Save site info (Site Name, Admin ID, Password)
      if (currentSiteId) {
        const desksRef = doc(db, "school_settings", "admin_desks");
        const desksSnap = await getDoc(desksRef);
        if (desksSnap.exists()) {
          const desksData = desksSnap.data();
          const list = [...(desksData.desks || [])];
          const matchedIdx = list.findIndex((d: any) => d.siteID === currentSiteId);
          if (matchedIdx !== -1) {
            list[matchedIdx] = {
              ...list[matchedIdx],
              siteName: siteName.trim(),
              adminId: adminId.trim(),
            };
            await setDoc(desksRef, { desks: list });
          }
        }

        const credRef = doc(db, "school_settings", "admin_credentials");
        const credSnap = await getDoc(credRef);
        if (credSnap.exists()) {
          const credData = credSnap.data();
          const list = [...(credData.credentials || [])];
          const matchedIdx = list.findIndex((c: any) => c.siteID === currentSiteId);
          if (matchedIdx !== -1) {
            list[matchedIdx] = {
              ...list[matchedIdx],
              adminId: adminId.trim(),
              adminPassword: adminPassword.trim(),
            };
            await setDoc(credRef, { credentials: list });
          }
        }
      }

      showToast("모든 설정이 성공적으로 저장되었습니다.", "success");
      onClose();
    } catch (err) {
      console.error("Failed to save settings:", err);
      showToast("설정 저장에 실패했습니다. 권한을 확인하세요.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to render the icon select list
  const renderIconSelect = (currentVal: string, onChange: (val: string) => void) => {
    return (
      <div className="relative flex items-center w-full min-w-0">
        <span className="absolute left-3 text-gray-500 text-sm z-10">
          <i className={`fas ${currentVal}`}></i>
        </span>
        <select
          value={currentVal}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-9 pr-8 py-1.5 border border-gray-300 rounded text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none appearance-none truncate"
        >
          {iconList.map((i) => (
            <option key={i.class} value={i.class}>
              {i.name}
            </option>
          ))}
        </select>
        <span className="absolute right-3 text-gray-400 text-xs pointer-events-none">
          <i className="fas fa-chevron-down"></i>
        </span>
      </div>
    );
  };

  const isQuickLinksCollapsed = !!collapsedCategories.quickLinks;

  // Calculate layout lines
  let currentRowWidth = 0;
  const wrapIndices = new Set<number>();
  draft.categories.forEach((c, idx) => {
    const span = Math.min(c.colSpan || 1, draft.columns);
    if (currentRowWidth + span > draft.columns) {
      if (idx > 0) wrapIndices.add(idx - 1);
      currentRowWidth = span;
    } else {
      currentRowWidth += span;
      if (currentRowWidth === draft.columns) {
        wrapIndices.add(idx);
        currentRowWidth = 0;
      }
    }
  });

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 overflow-y-auto custom-scrollbar pt-8 pb-8 px-4 flex items-start justify-center">
      <div className="w-full max-w-5xl bg-white shadow-2xl rounded-2xl relative flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-900">
            <i className="fas fa-tools mr-2 text-gray-500"></i> 메뉴 및 화면 설정 (관리자)
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-white border rounded-lg p-2 leading-none"
            type="button"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 bg-gray-100 overflow-y-auto flex-1 custom-scrollbar w-full">
          {/* 1. Global site settings */}
          <div className="mb-6 bg-emerald-50 p-4 md:p-5 rounded-xl border border-emerald-200 shadow-sm">
            <h4 className="text-sm font-bold text-emerald-800 mb-4">
              <i className="fas fa-globe text-emerald-600 mr-1"></i> 사이트 기본 정보 설정
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="w-full">
                <label className="block text-xs font-semibold text-emerald-700 mb-1">페이지 제목</label>
                <input
                  type="text"
                  value={draft.pageTitle}
                  onChange={(e) => handleUpdateField("pageTitle", e.target.value)}
                  className="w-full px-3 py-2 border border-emerald-300 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div className="w-full md:col-span-2">
                <label className="block text-xs font-semibold text-emerald-700 mb-1">페이지 설명</label>
                <input
                  type="text"
                  value={draft.pageDescription}
                  onChange={(e) => handleUpdateField("pageDescription", e.target.value)}
                  placeholder="예: 학교 업무에 필요한 자료를 쉽게 찾아보세요!"
                  className="w-full px-3 py-2 border border-emerald-300 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div className="w-full">
                <label className="block text-xs font-semibold text-emerald-700 mb-1">저작권 문구</label>
                <input
                  type="text"
                  value={draft.copyright}
                  onChange={(e) => handleUpdateField("copyright", e.target.value)}
                  className="w-full px-3 py-2 border border-emerald-300 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div className="w-full">
                <label className="block text-xs font-semibold text-emerald-700 mb-1">문의 이메일</label>
                <input
                  type="email"
                  value={draft.contactEmail}
                  onChange={(e) => handleUpdateField("contactEmail", e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-3 py-2 border border-emerald-300 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div className="w-full">
                <label className="block text-xs font-semibold text-red-600 mb-1">
                  <i className="fas fa-key mr-1"></i>마스터 암호
                </label>
                <input
                  type="text"
                  value={draft.masterPassword || ""}
                  onChange={(e) => handleUpdateField("masterPassword", e.target.value)}
                  placeholder="빈칸 시 미사용"
                  className="w-full px-3 py-2 border border-red-300 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-200"
                />
              </div>
            </div>

            {loadingSiteInfo ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 mt-4 pt-4 border-t border-emerald-200">
                <i className="fas fa-spinner fa-spin"></i>
                <span>사이트 상세 설정 정보(사이트 ID/비밀번호 등)를 불러오는 중...</span>
              </div>
            ) : (
              <>
                <div className="my-4 border-t border-emerald-200"></div>
                <h5 className="text-xs font-bold text-emerald-800 mb-3 flex items-center gap-1.5">
                  <i className="fas fa-id-card text-emerald-600"></i>
                  도움데스크 접속 정보 및 관리자 자격증명 설정
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="w-full">
                    <label className="block text-xs font-semibold text-emerald-700 mb-1">사이트 ID (고정)</label>
                    <input
                      type="text"
                      value={currentSiteId || ""}
                      disabled
                      className="w-full px-3 py-2 border border-emerald-200 bg-emerald-100/50 text-gray-500 rounded-lg text-sm outline-none font-mono cursor-not-allowed select-none"
                    />
                  </div>
                  <div className="w-full">
                    <label className="block text-xs font-semibold text-emerald-700 mb-1">도움데스크 이름 (사이트명)</label>
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="예: 마산중앙초"
                      className="w-full px-3 py-2 border border-emerald-300 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                      required
                    />
                  </div>
                  <div className="w-full">
                    <label className="block text-xs font-semibold text-emerald-700 mb-1">관리자 아이디 (Admin ID)</label>
                    <input
                      type="text"
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      placeholder="예: admin"
                      className="w-full px-3 py-2 border border-emerald-300 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                      required
                    />
                  </div>
                  <div className="w-full">
                    <label className="block text-xs font-semibold text-emerald-700 mb-1">관리자 암호 (Password)</label>
                    <input
                      type="text"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="비밀번호"
                      className="w-full px-3 py-2 border border-emerald-300 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-200 font-mono"
                      required
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 2. Grid Layout setup */}
          <div className="mb-6 bg-violet-50 p-4 md:p-5 rounded-xl border border-violet-200 shadow-sm">
            <h4 className="text-sm font-bold text-violet-800 mb-4">
              <i className="fas fa-border-all text-violet-600 mr-1"></i> 레이아웃 설정
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full">
                <label className="block text-xs font-semibold text-violet-700 mb-1">메인 열 (Column)</label>
                <select
                  value={draft.columns}
                  onChange={(e) => handleUpdateField("columns", parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-violet-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-200 bg-white"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}열
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full">
                <label className="block text-xs font-semibold text-violet-700 mb-1">메인 행 (Row)</label>
                <select
                  value={draft.rows}
                  onChange={(e) => handleUpdateField("rows", parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-violet-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-200 bg-white"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}행
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. QuickLinks Manager */}
          <div className="mb-6 bg-pink-50 p-4 md:p-5 rounded-xl border border-pink-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center cursor-pointer" onClick={() => toggleCollapse("quickLinks")}>
                <button
                  className="text-pink-500 hover:text-white bg-white hover:bg-pink-500 border border-pink-200 w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm mr-2"
                  type="button"
                >
                  <i className={`fas ${isQuickLinksCollapsed ? "fa-chevron-down" : "fa-chevron-up"}`}></i>
                </button>
                <h4 className="text-sm font-bold text-pink-800">
                  <i className="fas fa-external-link-alt text-pink-600 mr-1"></i> 외부 퀵링크 바 설정
                </h4>
              </div>
              <button
                onClick={handleAddQuickLink}
                className="px-3 py-1.5 bg-white text-pink-600 border border-pink-300 hover:bg-pink-100 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center"
                type="button"
              >
                + 링크 추가
              </button>
            </div>

            {!isQuickLinksCollapsed && (
              <div>
                <div className="mb-4 p-3 bg-pink-100/50 border border-pink-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-pink-800">
                      <i className="fas fa-arrows-alt-v mr-1"></i> 퀵링크 바 위치
                    </span>
                    <div className="flex gap-2">
                      <label className="flex items-center cursor-pointer bg-white px-2 py-1.5 rounded-md shadow-sm border border-pink-200">
                        <input
                          type="radio"
                          name="ql_position"
                          value="top"
                          checked={draft.quickLinkPosition === "top"}
                          onChange={() => handleUpdateField("quickLinkPosition", "top")}
                          className="mr-1.5 text-pink-600 focus:ring-pink-500 w-3.5 h-3.5"
                        />
                        <span className="text-xs font-bold text-gray-700">상단 (제목 아래)</span>
                      </label>
                      <label className="flex items-center cursor-pointer bg-white px-2 py-1.5 rounded-md shadow-sm border border-pink-200">
                        <input
                          type="radio"
                          name="ql_position"
                          value="bottom"
                          checked={draft.quickLinkPosition === "bottom"}
                          onChange={() => handleUpdateField("quickLinkPosition", "bottom")}
                          className="mr-1.5 text-pink-600 focus:ring-pink-500 w-3.5 h-3.5"
                        />
                        <span className="text-xs font-bold text-gray-700">하단 (목록 아래)</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 md:mt-0">
                    <span className="text-xs font-bold text-pink-800">
                      <i className="fas fa-fill-drip mr-1"></i> 바 바탕 색상
                    </span>
                    <select
                      value={draft.quickLinkBarColor}
                      onChange={(e) => handleUpdateField("quickLinkBarColor", e.target.value)}
                      className="px-2 py-1.5 border border-pink-200 rounded text-xs outline-none focus:ring-1 focus:ring-pink-300 shadow-sm bg-white"
                    >
                      {Object.keys(palette).map((c) => (
                        <option key={c} value={c}>
                          {colorNames[c] || c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {draft.quickLinks.map((ql, idx) => (
                    <div
                      key={ql.id}
                      className="flex flex-wrap lg:flex-nowrap items-center gap-2 bg-white p-3 rounded-lg border border-pink-100 shadow-sm"
                    >
                      <input
                        type="text"
                        value={ql.title}
                        onChange={(e) => handleUpdateQuickLink(ql.id, "title", e.target.value)}
                        placeholder="링크명"
                        className="w-full lg:w-32 px-3 py-1.5 border rounded text-xs outline-none focus:ring-1 focus:ring-pink-300"
                      />
                      <input
                        type="text"
                        value={ql.link}
                        onChange={(e) => handleUpdateQuickLink(ql.id, "link", e.target.value)}
                        placeholder="https://..."
                        className="w-full lg:flex-1 px-3 py-1.5 border rounded text-xs outline-none focus:ring-1 focus:ring-pink-300"
                      />
                      <div className="w-full lg:w-32">
                        {renderIconSelect(ql.icon, (val) => handleUpdateQuickLink(ql.id, "icon", val))}
                      </div>
                      <select
                        value={ql.color}
                        onChange={(e) => handleUpdateQuickLink(ql.id, "color", e.target.value)}
                        className="w-full lg:w-28 px-2 py-1.5 border rounded text-xs outline-none focus:ring-1 focus:ring-pink-300 bg-white"
                      >
                        {Object.keys(palette).map((c) => (
                          <option key={c} value={c}>
                            {colorNames[c] || c}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-1 ml-auto lg:ml-2">
                        <button
                          onClick={() => handleMoveQuickLinkUp(idx)}
                          className="w-7 h-7 bg-gray-50 border rounded text-gray-500 hover:bg-gray-200 disabled:opacity-35"
                          disabled={idx === 0}
                          type="button"
                        >
                          <i className="fas fa-arrow-up text-[10px]"></i>
                        </button>
                        <button
                          onClick={() => handleMoveQuickLinkDown(idx)}
                          className="w-7 h-7 bg-gray-50 border rounded text-gray-500 hover:bg-gray-200 disabled:opacity-35"
                          disabled={idx === draft.quickLinks.length - 1}
                          type="button"
                        >
                          <i className="fas fa-arrow-down text-[10px]"></i>
                        </button>
                        <button
                          onClick={() => handleRemoveQuickLink(ql.id)}
                          className="w-7 h-7 bg-red-50 border border-red-100 rounded text-red-500 hover:bg-red-500 hover:text-white"
                          type="button"
                        >
                          <i className="fas fa-times text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  {draft.quickLinks.length === 0 && (
                    <div className="text-center text-xs text-pink-400 py-4 bg-white rounded border border-dashed border-pink-200">
                      설정된 퀵링크가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Category Quick Jumper */}
          <div className="mb-6 bg-amber-50 p-4 md:p-5 rounded-xl border border-amber-200 shadow-sm">
            <h4 className="text-sm font-bold text-amber-800 mb-3">
              <i className="fas fa-location-arrow text-amber-600 mr-1"></i> 메인메뉴 빠른 이동
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {draft.categories.map((c, idx) => {
                const colors = palette[c.color] || palette.blue;
                return (
                  <React.Fragment key={c.id}>
                    <button
                      onClick={() => scrollToCategory(c.id)}
                      className="px-3 py-2 bg-white border border-amber-300 hover:bg-amber-100 hover:text-amber-700 rounded-lg text-xs md:text-sm font-bold text-amber-900 transition-colors shadow-sm flex items-center"
                      type="button"
                    >
                      <i className={`fas ${c.icon} mr-1.5 text-amber-500`}></i> {c.title || `메인메뉴 ${idx + 1}`}
                    </button>
                    {wrapIndices.has(idx) && idx !== draft.categories.length - 1 && (
                      <span className="text-amber-300 font-bold mx-1 text-lg">/</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* 5. Categories detailed forms */}
          <div className="space-y-6 w-full">
            {draft.categories.map((cat, cIdx) => {
              const limit = draft.columns * draft.rows;
              const isHidden = cIdx >= limit;
              const isBoard = cat.type === "board";
              const isTodo = cat.type === "todo";
              const isCollapsed = !!collapsedCategories[cat.id];

              return (
                <div
                  key={cat.id}
                  id={`setting-cat-${cat.id}`}
                  className={`border-2 border-blue-300 rounded-xl p-4 md:p-5 bg-blue-50 relative shadow-md w-full scroll-mt-4 ${
                    isHidden ? "opacity-50 grayscale" : ""
                  }`}
                >
                  {isHidden && (
                    <span className="absolute -top-3 left-4 bg-gray-500 text-white text-xs px-2 py-0.5 rounded-full z-10">
                      미표시 (행/열 격자 범위 초과)
                    </span>
                  )}

                  {/* Header actions */}
                  <div
                    className={`flex flex-col md:flex-row justify-between items-start md:items-center ${
                      isCollapsed ? "" : "mb-4 pb-3 border-b border-blue-200"
                    } gap-3`}
                  >
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      <button
                        onClick={() => toggleCollapse(cat.id)}
                        className="text-blue-500 hover:text-white bg-white hover:bg-blue-500 border border-blue-200 w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm mr-1"
                        type="button"
                      >
                        <i className={`fas ${isCollapsed ? "fa-chevron-down" : "fa-chevron-up"}`}></i>
                      </button>
                      <h5
                        className="font-bold text-base md:text-lg text-blue-900 flex items-center cursor-pointer select-none"
                        onClick={() => toggleCollapse(cat.id)}
                      >
                        <span className="bg-blue-600 text-white px-2 py-1 rounded-md text-xs md:text-sm mr-2 shadow-sm">
                          메인메뉴
                        </span>
                        <span className="text-xs md:text-sm font-normal text-blue-600 mr-2">({cIdx + 1}번째)</span>
                        {isCollapsed && (
                          <span className="text-sm text-gray-800 font-bold truncate max-w-[150px] md:max-w-xs">
                            {cat.title || "제목 없음"}
                          </span>
                        )}
                      </h5>
                      <div className={`ml-2 flex items-center ${isCollapsed ? "hidden md:flex" : ""}`}>
                        <label className="text-xs font-bold text-gray-500 mr-2 border-l border-gray-300 pl-3">
                          유형:
                        </label>
                        <select
                          value={cat.type}
                          onChange={(e) => handleUpdateCat(cat.id, "type", e.target.value)}
                          className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-bold text-blue-700 outline-none shadow-sm cursor-pointer"
                        >
                          <option value="menu">기본 메뉴 (하위 폴더/링크)</option>
                          <option value="board">일반 게시판 (리스트)</option>
                          <option value="todo">할일 게시판 (체크리스트)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-1.5 ml-auto">
                      <button
                        onClick={() => handleMoveCategoryUp(cIdx)}
                        className="text-blue-500 hover:text-white bg-white hover:bg-blue-500 border border-blue-200 w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 transition-colors"
                        disabled={cIdx === 0}
                        type="button"
                      >
                        <i className="fas fa-arrow-up text-xs"></i>
                      </button>
                      <button
                        onClick={() => handleMoveCategoryDown(cIdx)}
                        className="text-blue-500 hover:text-white bg-white hover:bg-blue-500 border border-blue-200 w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 transition-colors"
                        disabled={cIdx === draft.categories.length - 1}
                        type="button"
                      >
                        <i className="fas fa-arrow-down text-xs"></i>
                      </button>
                      <button
                        onClick={() => handleRemoveCategory(cat.id)}
                        className="text-red-400 hover:text-white bg-red-50 hover:bg-red-500 border border-red-200 hover:border-red-500 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ml-2"
                        type="button"
                      >
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  {!isCollapsed && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4 bg-white p-3 md:p-4 rounded-lg border border-blue-100 shadow-sm">
                        <div className="w-full md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-500 mb-1">
                            {isBoard ? "게시판 명" : isTodo ? "할일 보드명" : "메뉴명"}
                          </label>
                          <input
                            type="text"
                            value={cat.title}
                            onChange={(e) => handleUpdateCat(cat.id, "title", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-100 bg-white outline-none"
                          />
                        </div>
                        <div className="w-full md:col-span-3">
                          <label className="block text-xs font-semibold text-gray-500 mb-1">설명</label>
                          <input
                            type="text"
                            value={cat.subtitle}
                            onChange={(e) => handleUpdateCat(cat.id, "subtitle", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-100 bg-white outline-none"
                          />
                        </div>
                        <div className="w-full md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-500 mb-1">아이콘</label>
                          {renderIconSelect(cat.icon, (val) => handleUpdateCat(cat.id, "icon", val))}
                        </div>
                        <div className="w-full md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-500 mb-1">테마 색상</label>
                          <select
                            value={cat.color}
                            onChange={(e) => handleUpdateCat(cat.id, "color", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-100 bg-white outline-none"
                          >
                            {Object.keys(palette).map((c) => (
                              <option key={c} value={c}>
                                {colorNames[c] || c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-full md:col-span-1">
                          <label className="block text-xs font-semibold text-red-500 mb-1">
                            <i className="fas fa-lock text-xs mr-1"></i>접근 암호
                          </label>
                          <input
                            type="text"
                            value={cat.password || ""}
                            onChange={(e) => handleUpdateCat(cat.id, "password", e.target.value)}
                            placeholder="빈칸:없음"
                            className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-100 outline-none bg-red-50/20"
                          />
                        </div>

                        {/* Visual size modifier */}
                        {(isBoard || isTodo) ? (
                          <div className="w-full md:col-span-5 flex flex-col md:flex-row md:items-center bg-gray-50 border border-gray-200 rounded-lg p-3 mt-1 shadow-inner">
                            <label className="block text-xs font-bold text-gray-700 flex-shrink-0 md:mr-4 mb-2 md:mb-0">
                              <i className="fas fa-arrows-alt-h mr-1.5 text-blue-500"></i>박스 크기 (가로 병합)
                            </label>
                            <div className="flex gap-2 flex-wrap">
                              {Array.from({ length: draft.columns }, (_, i) => i + 1).map((n) => (
                                <label
                                  key={n}
                                  className="flex items-center cursor-pointer bg-white px-3 py-1.5 border border-gray-300 rounded-md shadow-sm hover:bg-blue-50 transition-colors"
                                >
                                  <input
                                    type="radio"
                                    name={`colspan_${cat.id}`}
                                    value={n}
                                    checked={(cat.colSpan || 1) === n}
                                    onChange={() => handleUpdateCat(cat.id, "colSpan", n)}
                                    className="mr-2 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                  />
                                  <span className="text-xs font-bold text-gray-700">{n}열</span>
                                </label>
                              ))}
                            </div>
                            <span className="text-[10px] text-gray-400 mt-2 md:mt-0 md:ml-4">
                              (*최대 {draft.columns}열 크기로만 설정 가능)
                            </span>
                          </div>
                        ) : (
                          <div className="w-full md:col-span-5">
                            <label className="block text-xs font-semibold text-blue-500 mb-1">
                              <i className="fas fa-external-link-alt text-xs mr-1"></i>단독 외부링크
                            </label>
                            <input
                              type="text"
                              value={cat.link || ""}
                              onChange={(e) => handleUpdateCat(cat.id, "link", e.target.value)}
                              placeholder="이동할 URL 입력 (입력 시 하위 목록 대신 외부 창이 열립니다)"
                              className="w-full px-3 py-2 border border-blue-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                          </div>
                        )}
                      </div>

                      {/* Specialized type notes */}
                      {isBoard && (
                        <div className="bg-teal-50 text-teal-700 text-xs p-4 rounded-lg text-center border border-teal-200 font-bold w-full shadow-inner">
                          <i className="fas fa-clipboard-list mr-1 text-lg mb-2 block"></i>이 메뉴는{" "}
                          <strong className="underline decoration-teal-300 underline-offset-4">일반 게시판</strong>
                          으로 작동합니다. 메인화면에는 최근 5개 글이 나타나며, 클릭하면 게시판 전용 화면이 열립니다.
                        </div>
                      )}

                      {isTodo && (
                        <div className="bg-amber-50 text-amber-700 text-xs p-4 rounded-lg text-center border border-amber-200 font-bold w-full shadow-inner">
                          <i className="fas fa-check-square mr-1 text-lg mb-2 block"></i>이 메뉴는{" "}
                          <strong className="underline decoration-amber-300 underline-offset-4">
                            할일(To-do) 게시판
                          </strong>
                          으로 작동합니다. 완료되지 않은 목록이 홈화면에 바로 노출되며 누구나 손쉽게 체크할 수 있습니다.
                        </div>
                      )}

                      {/* Folder group editor (if regular menu and doesn't have solitary link) */}
                      {!isBoard && !isTodo && (!cat.link || !cat.link.trim()) && (
                        <div className="border border-indigo-200 rounded-lg p-3 md:p-4 bg-indigo-50 w-full shadow-inner">
                          <div className="flex justify-between items-center mb-4 border-b border-indigo-200 pb-2">
                            <h6 className="font-bold text-xs md:text-sm text-indigo-800 flex items-center">
                              <i className="fas fa-layer-group text-indigo-500 mr-2"></i> 1차 하위 (그룹 폴더 목록)
                            </h6>
                            <button
                              onClick={() => handleAddGroup(cat.id)}
                              className="text-[10px] md:text-xs bg-white border border-indigo-300 text-indigo-700 px-3 py-1.5 rounded-md font-bold hover:bg-indigo-100 whitespace-nowrap shadow-sm"
                              type="button"
                            >
                              + 그룹 추가
                            </button>
                          </div>

                          <div className="space-y-4 w-full">
                            {(cat.groups || []).map((group, gIdx) => (
                              <div
                                key={group.id}
                                id={`setting-grp-${cat.id}-${gIdx}`}
                                className="bg-white border border-indigo-200 rounded-lg p-3 md:p-4 relative w-full shadow-sm animate-fade-in"
                              >
                                <div className="flex justify-between items-center mb-3 border-b border-indigo-50 pb-2">
                                  <span className="text-[10px] md:text-xs font-bold text-indigo-400">
                                    그룹 설정 <span className="font-normal text-indigo-300">({gIdx + 1}번째)</span>
                                  </span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleMoveGroupUp(cat.id, gIdx)}
                                      className="text-indigo-400 hover:text-white bg-indigo-50 hover:bg-indigo-400 border border-indigo-100 w-6 h-6 md:w-7 md:h-7 rounded flex justify-center items-center disabled:opacity-30 transition-colors"
                                      disabled={gIdx === 0}
                                      type="button"
                                    >
                                      <i className="fas fa-arrow-up text-[10px]"></i>
                                    </button>
                                    <button
                                      onClick={() => handleMoveGroupDown(cat.id, gIdx)}
                                      className="text-indigo-400 hover:text-white bg-indigo-50 hover:bg-indigo-400 border border-indigo-100 w-6 h-6 md:w-7 md:h-7 rounded flex justify-center items-center disabled:opacity-30 transition-colors"
                                      disabled={gIdx === cat.groups!.length - 1}
                                      type="button"
                                    >
                                      <i className="fas fa-arrow-down text-[10px]"></i>
                                    </button>
                                    <button
                                      onClick={() => handleRemoveGroup(cat.id, group.id)}
                                      className="text-red-400 hover:text-white bg-red-50 hover:bg-red-400 border border-red-100 w-6 h-6 md:w-7 md:h-7 rounded flex justify-center items-center ml-1 transition-colors"
                                      type="button"
                                    >
                                      <i className="fas fa-times text-[10px]"></i>
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full mb-4">
                                  <div className="w-full md:col-span-2">
                                    <label className="block text-[10px] md:text-xs font-semibold text-gray-500 mb-1">
                                      그룹명
                                    </label>
                                    <input
                                      type="text"
                                      value={group.title}
                                      onChange={(e) => handleUpdateGroup(cat.id, group.id, "title", e.target.value)}
                                      className="w-full px-3 py-2 border rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-indigo-100 outline-none bg-white"
                                    />
                                  </div>
                                  <div className="w-full">
                                    <label className="block text-[10px] md:text-xs font-semibold text-gray-500 mb-1">
                                      아이콘
                                    </label>
                                    {renderIconSelect(group.icon, (val) =>
                                      handleUpdateGroup(cat.id, group.id, "icon", val)
                                    )}
                                  </div>
                                  <div className="w-full">
                                    <label className="block text-[10px] md:text-xs font-semibold text-red-500 mb-1">
                                      보호 암호
                                    </label>
                                    <input
                                      type="text"
                                      value={group.password || ""}
                                      onChange={(e) => handleUpdateGroup(cat.id, group.id, "password", e.target.value)}
                                      placeholder="없음"
                                      className="w-full px-3 py-2 border rounded-lg text-xs md:text-sm border-red-200 bg-red-50/20 focus:ring-2 focus:ring-red-100 outline-none"
                                    />
                                  </div>
                                  <div className="w-full md:col-span-4">
                                    <label className="block text-[10px] md:text-xs font-semibold text-blue-500 mb-1">
                                      단독 링크 연결 (선택)
                                    </label>
                                    <input
                                      type="text"
                                      value={group.link || ""}
                                      onChange={(e) => handleUpdateGroup(cat.id, group.id, "link", e.target.value)}
                                      placeholder="여기에 링크 입력 시 2차 하위 링크 목록은 비활성화되며 바로 연결됩니다"
                                      className="w-full px-3 py-2 border border-blue-200 bg-white rounded-lg text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                  </div>
                                </div>

                                {/* Link Items inside Folder group */}
                                {(!group.link || !group.link.trim()) && (
                                  <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 w-full shadow-inner mt-2">
                                    <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
                                      <h6 className="text-[10px] md:text-xs font-bold text-slate-700">
                                        <i className="fas fa-link mr-1 text-slate-500"></i> 2차 하위 (자료 링크 목록)
                                      </h6>
                                      <button
                                        onClick={() => handleAddItem(cat.id, group.id)}
                                        className="text-[10px] border border-slate-400 bg-white px-2 py-1.5 rounded-md hover:bg-slate-200 font-bold shadow-sm text-slate-700 transition-colors"
                                        type="button"
                                      >
                                        + 링크 추가
                                      </button>
                                    </div>

                                    <div className="space-y-3 w-full">
                                      {group.items && group.items.length > 0 ? (
                                        group.items.map((item, iIdx) => (
                                          <div
                                            key={iIdx}
                                            id={`setting-item-${cat.id}-${gIdx}-${iIdx}`}
                                            className="flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-lg w-full relative shadow-sm hover:border-slate-300 transition-colors animate-fade-in"
                                          >
                                            <div className="flex justify-between items-center">
                                              <span className="text-[10px] font-bold text-slate-400">
                                                링크 항목 #{iIdx + 1}
                                              </span>
                                              <div className="flex gap-1">
                                                <button
                                                  onClick={() => handleMoveItemUp(cat.id, group.id, iIdx)}
                                                  className="w-6 h-6 border bg-slate-50 rounded flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-500 disabled:opacity-30 transition-colors"
                                                  disabled={iIdx === 0}
                                                  type="button"
                                                >
                                                  <i className="fas fa-arrow-up text-[10px]"></i>
                                                </button>
                                                <button
                                                  onClick={() => handleMoveItemDown(cat.id, group.id, iIdx)}
                                                  className="w-6 h-6 border bg-slate-50 rounded flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-500 disabled:opacity-30 transition-colors"
                                                  disabled={iIdx === group.items.length - 1}
                                                  type="button"
                                                >
                                                  <i className="fas fa-arrow-down text-[10px]"></i>
                                                </button>
                                                <button
                                                  onClick={() => handleRemoveItem(cat.id, group.id, iIdx)}
                                                  className="w-6 h-6 border bg-red-50 border-red-100 rounded flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-colors md:hidden ml-auto"
                                                  type="button"
                                                >
                                                  <i className="fas fa-times text-[10px]"></i>
                                                </button>
                                              </div>
                                            </div>

                                            <div className="w-full flex flex-col md:flex-row items-center gap-2">
                                              <div className="flex-1 w-full min-w-0">
                                                <input
                                                  type="text"
                                                  value={item.title}
                                                  onChange={(e) =>
                                                    handleUpdateItem(
                                                      cat.id,
                                                      group.id,
                                                      iIdx,
                                                      "title",
                                                      e.target.value
                                                    )
                                                  }
                                                  placeholder="자료명 (예: 2026학년도 학사달력)"
                                                  className="w-full px-3 py-2 border rounded-lg text-xs md:text-sm outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-200"
                                                />
                                              </div>
                                              <div className="flex-1 w-full min-w-0">
                                                <input
                                                  type="text"
                                                  value={item.link}
                                                  onChange={(e) =>
                                                    handleUpdateItem(cat.id, group.id, iIdx, "link", e.target.value)
                                                  }
                                                  placeholder="링크 URL"
                                                  className="w-full px-3 py-2 border rounded-lg text-xs md:text-sm outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-200"
                                                />
                                              </div>
                                              <div className="w-full md:w-24 lg:w-28 flex-shrink-0">
                                                <input
                                                  type="text"
                                                  value={item.password || ""}
                                                  onChange={(e) =>
                                                    handleUpdateItem(
                                                      cat.id,
                                                      group.id,
                                                      iIdx,
                                                      "password",
                                                      e.target.value
                                                    )
                                                  }
                                                  placeholder="암호 (선택)"
                                                  className="w-full px-3 py-2 border border-red-200 rounded-lg text-xs md:text-sm outline-none bg-red-50/20 focus:bg-white focus:ring-2 focus:ring-red-100"
                                                />
                                              </div>
                                              <button
                                                onClick={() => handleRemoveItem(cat.id, group.id, iIdx)}
                                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 w-8 h-8 rounded-lg hidden md:flex items-center justify-center flex-shrink-0 ml-1 transition-colors"
                                                type="button"
                                              >
                                                <i className="fas fa-times"></i>
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-[10px] md:text-xs text-slate-500 text-center py-3 bg-white border border-dashed border-slate-300 rounded-lg w-full">
                                          등록된 하위 자료 링크가 없습니다. 우측 상단의 링크 추가를 누르세요.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                            {(cat.groups || []).length === 0 && (
                              <p className="text-[10px] md:text-sm text-indigo-500 text-center py-4 w-full bg-white rounded-lg border border-dashed border-indigo-200">
                                등록된 그룹이 없습니다. 우측 상단의 추가 버튼을 눌러 폴더 그룹을 생성하세요.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Append Category Button */}
            <button
              onClick={handleAddCategory}
              className="w-full py-4 border-2 border-dashed border-blue-400 text-blue-700 bg-blue-50 rounded-xl font-bold text-sm shadow-sm mt-4 hover:bg-blue-100 transition-colors cursor-pointer"
              type="button"
            >
              + 새 메인메뉴 추가하기
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center flex-shrink-0 rounded-b-2xl">
          <button
            onClick={onLogout}
            className="px-4 py-2 text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors text-sm"
            type="button"
          >
            <i className="fas fa-sign-out-alt mr-1"></i> 로그아웃
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              disabled={isSaving}
              type="button"
            >
              닫기
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm min-w-[120px] flex items-center justify-center gap-1.5"
              disabled={isSaving}
              type="button"
            >
              {isSaving ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> 저장 중
                </>
              ) : (
                "변경사항 저장"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
