import React, { useState, useEffect } from "react";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously, signOut } from "firebase/auth";
import { auth, db, handleFirestoreError } from "./firebase";
import { AppState, Category, Post, OperationType, DeskMeta } from "./types";
import { migrateDataFormat, palette, formatUrl } from "./utils";

// Component imports
import NatureBackground from "./components/NatureBackground";
import SchoolIllustration from "./components/SchoolIllustration";
import CategoryCard from "./components/CategoryCard";
import AdminSettingsModal from "./components/AdminSettingsModal";
import BoardModal from "./components/BoardModal";
import TodoModal from "./components/TodoModal";
import PasswordModal from "./components/PasswordModal";
import AdminLoginModal from "./components/AdminLoginModal";
import SuperAdminModal from "./components/SuperAdminModal";
import Toast from "./components/Toast";

// Initial seed state in case Firestore document is blank
const defaultState: AppState = {
  pageTitle: "학교업무 대시보드",
  pageDescription: "학교 업무에 필요한 다양한 자료, 게시판 및 일정을 한눈에 모아보세요!",
  copyright: "© Netsci 모든 권리 보유",
  contactEmail: "",
  masterPassword: "",
  columns: 3,
  rows: 2,
  quickLinkPosition: "top",
  quickLinkBarColor: "white",
  quickLinks: [
    { id: "ql_1", title: "나이스(NEIS)", icon: "fa-school", color: "blue", link: "https://www.neis.go.kr" },
    { id: "ql_2", title: "에듀파인", icon: "fa-building", color: "green", link: "https://klef.go.kr" },
    { id: "ql_3", title: "공식 홈페이지", icon: "fa-home", color: "purple", link: "https://" }
  ],
  categories: [
    {
      id: "cat_1",
      type: "menu",
      title: "교무기획부",
      subtitle: "학교 행사 및 일상 교무 기획 정보",
      icon: "fa-chalkboard",
      color: "blue",
      colSpan: 1,
      groups: [
        {
          id: "grp_1",
          title: "1학기 교육과정 자료",
          icon: "fa-folder",
          color: "blue",
          items: [
            { title: "2026학년도 연간 교육계획서", link: "#", password: "" },
            { title: "주간학습안내 서식", link: "#", password: "" }
          ]
        }
      ]
    },
    {
      id: "cat_2",
      type: "board",
      title: "공지 및 업무 안내",
      subtitle: "교직원 일일 연락 사항 및 긴급 공지",
      icon: "fa-bullhorn",
      color: "red",
      colSpan: 1,
      posts: [
        {
          id: "post_1",
          title: "2026학년도 교직원 안전 연수 안내",
          author: "교무부",
          date: new Date().toISOString().slice(0, 10),
          timestamp: Date.now(),
          views: 1,
          content: "교직원 안전 교육 연수가 이번 주 금요일 시청각실에서 개최되오니 모든 교직원분들께서는 참여 부탁드립니다."
        }
      ]
    },
    {
      id: "cat_3",
      type: "todo",
      title: "금주 수행 과제",
      subtitle: "제출 마감 및 협조 필요 업무",
      icon: "fa-check-square",
      color: "amber",
      colSpan: 1,
      todos: [
        { id: "todo_1", title: "학교 폭력 예방 연수 서명 제출", date: "", assignee: "안전부", completed: false, timestamp: Date.now() },
        { id: "todo_2", title: "학급 환경미화 보고서 마감", date: "", assignee: "담임교사", completed: false, timestamp: Date.now() }
      ]
    }
  ]
};

export default function App() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Multi-site administrative states
  const [currentSiteId, setCurrentSiteId] = useState("main");
  const [desksMetaList, setDesksMetaList] = useState<DeskMeta[]>([]);
  const [loggedSiteAdmin, setLoggedSiteAdmin] = useState<{ siteID: string; siteName: string; adminId: string } | null>(null);

  // Auto-verify and seed required desks and credentials in Firestore if missing or outdated
  useEffect(() => {
    const seedRequiredDesks = async () => {
      try {
        const adminDesksRef = doc(db, "school_settings", "admin_desks");
        const adminCredsRef = doc(db, "school_settings", "admin_credentials");

        const desksSnap = await getDoc(adminDesksRef);
        const credsSnap = await getDoc(adminCredsRef);

        let currentDesks: any[] = [];
        let currentCreds: any[] = [];

        if (desksSnap.exists()) {
          currentDesks = desksSnap.data().desks || [];
        }
        if (credsSnap.exists()) {
          currentCreds = credsSnap.data().credentials || [];
        }

        // Define our desired base desks
        const requiredDesks = [
          { siteID: "main", siteName: "기본 교무실 도움데스크", adminId: "admin" },
          { siteID: "msjungang", siteName: "마산중앙초", adminId: "admin" }
        ];

        const requiredCreds = [
          { siteID: "main", adminId: "admin", adminPassword: "1245" },
          { siteID: "msjungang", adminId: "admin", adminPassword: "6245" }
        ];

        // Check if we need to update/seed
        let needsUpdate = false;

        // Ensure "main" is the first one, and both exist
        const updatedDesks = [...currentDesks];
        const updatedCreds = [...currentCreds];

        requiredDesks.forEach((req) => {
          const matchIdx = updatedDesks.findIndex(d => d.siteID === req.siteID);
          if (matchIdx === -1) {
            updatedDesks.push(req);
            needsUpdate = true;
          } else {
            // Check if name/admin changed
            if (updatedDesks[matchIdx].siteName !== req.siteName || updatedDesks[matchIdx].adminId !== req.adminId) {
              updatedDesks[matchIdx] = req;
              needsUpdate = true;
            }
          }
        });

        requiredCreds.forEach((req) => {
          const matchIdx = updatedCreds.findIndex(c => c.siteID === req.siteID);
          if (matchIdx === -1) {
            updatedCreds.push(req);
            needsUpdate = true;
          } else {
            if (updatedCreds[matchIdx].adminId !== req.adminId || updatedCreds[matchIdx].adminPassword !== req.adminPassword) {
              updatedCreds[matchIdx] = req;
              needsUpdate = true;
            }
          }
        });

        // Ensure "main" is the very first one in updatedDesks list
        const mainIdx = updatedDesks.findIndex(d => d.siteID === "main");
        if (mainIdx > 0) {
          const [mainDesk] = updatedDesks.splice(mainIdx, 1);
          updatedDesks.unshift(mainDesk);
          needsUpdate = true;
        }

        if (needsUpdate || currentDesks.length === 0) {
          await setDoc(adminDesksRef, { desks: updatedDesks });
          await setDoc(adminCredsRef, { credentials: updatedCreds });
          console.log("Successfully seeded/updated 'main' and 'msjungang' desks in Firestore.");
        }
      } catch (err) {
        console.warn("Auto-seeding required desks error: ", err);
      }
    };

    seedRequiredDesks();
  }, []);

  // Password Gating States
  const [isMasterUnlocked, setIsMasterUnlocked] = useState(false);
  const [unlockedEntities, setUnlockedEntities] = useState<Set<string>>(new Set());
  const [failedPasswordAttempts, setFailedAttempts] = useState(0);
  
  // Pending password target storage
  const [pendingTarget, setPendingTarget] = useState<{
    type: "cat" | "group" | "item" | "board_post" | "master";
    catId: string;
    groupIdx?: number;
    itemIdx?: number;
    postId?: string;
  } | null>(null);

  // Modal Open States
  const [selectedBoardCategory, setSelectedBoardCategory] = useState<Category | null>(null);
  const [selectedTodoCategory, setSelectedTodoCategory] = useState<Category | null>(null);
  const [directPostId, setDirectPostId] = useState<string | null>(null);
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSuperAdminModalOpen, setIsSuperAdminModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Derived authorization check for editing current site
  const isCurrentDeskEditable = isAdmin || (loggedSiteAdmin !== null && loggedSiteAdmin.siteID === currentSiteId);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  // 1. Listen to Authentication Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAdmin(!user.isAnonymous);
      } else {
        // Automatically login anonymously if not signed in (optional fallback)
        try {
          await signInAnonymously(auth);
          setIsAdmin(false);
        } catch (err) {
          console.warn("Anonymous authentication skipped or disabled by administrator configuration:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2a. Listen to Admin Desks List Changes (Global list of desks)
  useEffect(() => {
    const adminDesksRef = doc(db, "school_settings", "admin_desks");
    const unsubscribe = onSnapshot(
      adminDesksRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && Array.isArray(data.desks)) {
            setDesksMetaList(data.desks);
          } else {
            setDesksMetaList([]);
          }
        } else {
          // Document does not exist yet. Seed with default main desk
          const defaultDesks: DeskMeta[] = [
            {
              siteID: "main",
              siteName: "기본 교무실 도움데스크",
              adminId: "admin",
              adminPassword: "1245",
            },
            {
              siteID: "msjungang",
              siteName: "마산중앙초 도움데스크",
              adminId: "admin",
              adminPassword: "6245",
            },
          ];
          setDesksMetaList(defaultDesks);
          setDoc(adminDesksRef, { desks: defaultDesks }).catch((err) => {
            console.warn("Failed to automatically seed default admin desks:", err);
          });
        }
      },
      (error) => {
        console.error("Failed to load admin desks list:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2b. Subscribe to Site-specific Firestore Document Changes
  useEffect(() => {
    setIsLoading(true);
    const settingsDocRef = doc(db, "school_settings", currentSiteId);
    const unsubscribe = onSnapshot(
      settingsDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const rawData = snapshot.data();
          const migrated = migrateDataFormat(rawData);
          setAppState(migrated);
        } else {
          // Document does not exist yet. Seed with localized configuration
          const deskMeta = desksMetaList.find((d) => d.siteID === currentSiteId);
          const localizedTitle = deskMeta ? deskMeta.siteName : defaultState.pageTitle;
          const localizedState: AppState = {
            ...defaultState,
            pageTitle: localizedTitle,
          };
          setAppState(localizedState);
          setDoc(settingsDocRef, localizedState).catch((err) => {
            console.warn("Failed to automatically seed default settings:", err);
          });
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore loading error:", error);
        setIsLoading(false);
        showToast("데이터베이스를 읽어오는 데 실패했습니다. 규칙을 확인하세요.", "error");
      }
    );

    return () => unsubscribe();
  }, [currentSiteId, desksMetaList]);

  // 3. Keep Modals Synced when AppState Updates Live
  useEffect(() => {
    if (!appState) return;

    if (selectedBoardCategory) {
      const freshCat = appState.categories.find((c) => c.id === selectedBoardCategory.id);
      if (freshCat) setSelectedBoardCategory(freshCat);
    }
    if (selectedTodoCategory) {
      const freshCat = appState.categories.find((c) => c.id === selectedTodoCategory.id);
      if (freshCat) setSelectedTodoCategory(freshCat);
    }
  }, [appState, selectedBoardCategory, selectedTodoCategory]);

  // 4. Save entire state back to database
  const saveStateToDatabase = async (nextState: AppState) => {
    const settingsDocRef = doc(db, "school_settings", currentSiteId);
    try {
      await setDoc(settingsDocRef, nextState);
      setAppState(nextState);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `school_settings/${currentSiteId}`);
    }
  };

  // --- Lock Evaluation & Clicks ---
  const handleCategoryClick = (e: React.MouseEvent, catId: string) => {
    const cat = appState?.categories.find((c) => c.id === catId);
    if (!cat) return;

    const isLocked = !!(cat.password && cat.password.trim());
    const isUnlocked = isMasterUnlocked || unlockedEntities.has(catId);

    if (isLocked && !isUnlocked) {
      e.preventDefault();
      setPendingTarget({ type: "cat", catId });
      setFailedAttempts(0);
      setIsPasswordModalOpen(true);
    } else {
      // Normal Category navigation
      if (cat.type === "board") {
        setSelectedBoardCategory(cat);
      } else if (cat.type === "todo") {
        setSelectedTodoCategory(cat);
      }
    }
  };

  const handleGroupClick = (e: React.MouseEvent, catId: string, groupIdx: number) => {
    const cat = appState?.categories.find((c) => c.id === catId);
    const group = cat?.groups?.[groupIdx];
    if (!group) return;

    const gId = `${catId}-grp-${groupIdx}`;
    const isLocked = !!(group.password && group.password.trim());
    const isUnlocked = isMasterUnlocked || unlockedEntities.has(gId);

    if (isLocked && !isUnlocked) {
      e.preventDefault();
      setPendingTarget({ type: "group", catId, groupIdx });
      setFailedAttempts(0);
      setIsPasswordModalOpen(true);
    }
  };

  const handleItemClick = (e: React.MouseEvent, catId: string, groupIdx: number, itemIdx: number) => {
    const cat = appState?.categories.find((c) => c.id === catId);
    const item = cat?.groups?.[groupIdx]?.items?.[itemIdx];
    if (!item) return;

    const itemId = `${catId}-grp-${groupIdx}-item-${itemIdx}`;
    const isLocked = !!(item.password && item.password.trim());
    const isUnlocked = isMasterUnlocked || unlockedEntities.has(itemId);

    if (isLocked && !isUnlocked) {
      e.preventDefault();
      setPendingTarget({ type: "item", catId, groupIdx, itemIdx });
      setFailedAttempts(0);
      setIsPasswordModalOpen(true);
    }
  };

  const handlePostDirectClick = (catId: string, postId: string) => {
    const cat = appState?.categories.find((c) => c.id === catId);
    if (!cat) return;

    const isLocked = !!(cat.password && cat.password.trim());
    const isUnlocked = isMasterUnlocked || unlockedEntities.has(catId);

    if (isLocked && !isUnlocked) {
      setPendingTarget({ type: "board_post", catId, postId });
      setFailedAttempts(0);
      setIsPasswordModalOpen(true);
    } else {
      setDirectPostId(postId);
      setSelectedBoardCategory(cat);
    }
  };

  const handleCheckTodoMain = async (catId: string, todoId: string) => {
    if (!appState) return;
    const nextCategories = appState.categories.map((cat) => {
      if (cat.id === catId) {
        const nextTodos = (cat.todos || []).map((t) => {
          if (t.id === todoId) {
            return { ...t, completed: true, timestamp: Date.now() };
          }
          return t;
        });
        return { ...cat, todos: nextTodos };
      }
      return cat;
    });

    try {
      await saveStateToDatabase({ ...appState, categories: nextCategories });
      showToast("할 일이 완료 처리되었습니다.", "success");
    } catch (err) {
      showToast("할 일을 완료 처리하는 데 실패했습니다.", "error");
    }
  };

  // --- Password Gate Verification ---
  const handlePasswordSubmit = (password: string) => {
    if (!appState || !pendingTarget) return;

    let success = false;
    let unlockKey = "";

    if (pendingTarget.type === "master") {
      success = appState.masterPassword === password;
      if (success) {
        setIsMasterUnlocked(true);
        showToast("마스터 패스워드로 전체 잠금이 해제되었습니다.", "success");
      }
    } else if (pendingTarget.type === "cat") {
      const cat = appState.categories.find((c) => c.id === pendingTarget.catId);
      success = cat?.password === password || appState.masterPassword === password;
      unlockKey = pendingTarget.catId;
    } else if (pendingTarget.type === "group" && pendingTarget.groupIdx !== undefined) {
      const cat = appState.categories.find((c) => c.id === pendingTarget.catId);
      const group = cat?.groups?.[pendingTarget.groupIdx];
      success = group?.password === password || appState.masterPassword === password;
      unlockKey = `${pendingTarget.catId}-grp-${pendingTarget.groupIdx}`;
    } else if (
      pendingTarget.type === "item" &&
      pendingTarget.groupIdx !== undefined &&
      pendingTarget.itemIdx !== undefined
    ) {
      const cat = appState.categories.find((c) => c.id === pendingTarget.catId);
      const item = cat?.groups?.[pendingTarget.groupIdx]?.items?.[pendingTarget.itemIdx];
      success = item?.password === password || appState.masterPassword === password;
      unlockKey = `${pendingTarget.catId}-grp-${pendingTarget.groupIdx}-item-${pendingTarget.itemIdx}`;
    } else if (pendingTarget.type === "board_post" && pendingTarget.postId) {
      const cat = appState.categories.find((c) => c.id === pendingTarget.catId);
      success = cat?.password === password || appState.masterPassword === password;
      unlockKey = pendingTarget.catId;
    }

    if (success) {
      if (unlockKey) {
        setUnlockedEntities((prev) => {
          const next = new Set(prev);
          next.add(unlockKey);
          return next;
        });
        showToast("암호가 확인되었습니다.", "success");
      }

      // Execute subsequent routing if necessary
      if (pendingTarget.type === "cat") {
        const cat = appState.categories.find((c) => c.id === pendingTarget.catId);
        if (cat) {
          if (cat.type === "board") setSelectedBoardCategory(cat);
          else if (cat.type === "todo") setSelectedTodoCategory(cat);
        }
      } else if (pendingTarget.type === "board_post" && pendingTarget.postId) {
        const cat = appState.categories.find((c) => c.id === pendingTarget.catId);
        if (cat) {
          setDirectPostId(pendingTarget.postId);
          setSelectedBoardCategory(cat);
        }
      }

      setIsPasswordModalOpen(false);
      setPendingTarget(null);
    } else {
      const nextFailed = failedPasswordAttempts + 1;
      setFailedAttempts(nextFailed);
      if (nextFailed >= 3) {
        setIsPasswordModalOpen(false);
        setPendingTarget(null);
        showToast("암호를 3회 연속 틀려 보안을 위해 초기화합니다.", "error");
        setTimeout(() => location.reload(), 1200);
      } else {
        showToast(`비밀번호가 다릅니다. (실패 횟수: ${nextFailed}/3)`, "error");
      }
    }
  };

  const handleMasterLockToggle = () => {
    if (isMasterUnlocked) {
      setIsMasterUnlocked(false);
      setUnlockedEntities(new Set());
      showToast("마스터 권한을 해제하여 모든 잠금 장치를 복원했습니다.", "success");
    } else {
      setPendingTarget({ type: "master", catId: "" });
      setFailedAttempts(0);
      setIsPasswordModalOpen(true);
    }
  };

  const handleGearClick = () => {
    if (isCurrentDeskEditable) {
      setIsSettingsModalOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      if (isAdmin) {
        await signOut(auth);
        // Fallback back to anonymous login if supported
        try {
          await signInAnonymously(auth);
        } catch (anonErr) {
          console.warn("Anonymous authentication skipped during logout:", anonErr);
        }
        setIsAdmin(false);
      }
      setLoggedSiteAdmin(null);
      setIsSettingsModalOpen(false);
      setIsSuperAdminModalOpen(false);
      setCurrentSiteId("main");
      showToast("관리자 로그아웃 완료.", "success");
    } catch (err) {
      showToast("로그아웃 도중 오류가 발생했습니다.", "error");
    }
  };

  // --- Sub saving operations inside modals ---
  const handleSaveCategoryInModal = async (updatedCat: Category) => {
    if (!appState) return;
    const nextCats = appState.categories.map((c) => {
      if (c.id === updatedCat.id) return updatedCategoryWithModifiedFlag(updatedCat, c);
      return c;
    });

    await onSave({ ...appState, categories: nextCats });
  };

  // Marks posts as read or unmodified appropriately
  const onSave = async (category: Category) => {
    if (!appState) return;
    await saveStateToDatabase({
      ...appState,
      categories: appState.categories.map((c) => (c.id === category.id ? category : c))
    });
  };

  // Set standard API save call
  const handleSaveState = async (newState: AppState) => {
    await saveStateToDatabase(newState);
  };

  // Helper to tag edited posts with views and prevent losing timestamps
  const updatedCategoryWithModifiedFlag = (fresh: Category, old: Category): Category => {
    // If it's a board, check for new posts versus old and clear the isNew tag after 1 day or keep it
    return fresh;
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50/60 z-50">
        <NatureBackground />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-bold text-lg">데이터베이스 연결 확인 중...</p>
          <p className="text-gray-400 text-sm mt-1">네트워크 환경에 따라 최대 수 초가 소요될 수 있습니다.</p>
        </div>
      </div>
    );
  }

  const activeQuickLinks = appState?.quickLinks || [];
  const qPosition = appState?.quickLinkPosition || "top";
  const qColor = appState?.quickLinkBarColor || "white";
  const barColorBg = palette[qColor] ? palette[qColor].bg : "bg-white";

  const renderQuickLinksBar = () => {
    if (activeQuickLinks.length === 0) return null;
    return (
      <div className="w-full mt-4 mb-4 px-2">
        <div
          className={`w-[99%] max-w-6xl mx-auto ${barColorBg} bg-opacity-80 backdrop-blur-md shadow-md border border-gray-200/80 rounded-2xl p-4 flex flex-wrap justify-start items-center gap-3 animate-fade-in`}
        >
          <span className="text-xs font-bold text-gray-400 mr-2 flex items-center gap-1.5 whitespace-nowrap uppercase tracking-wider">
            <i className="fas fa-bookmark text-pink-400"></i> 바로가기
          </span>
          {activeQuickLinks.map((ql) => {
            const colors = palette[ql.color] || palette.blue;
            return (
              <a
                key={ql.id}
                href={formatUrl(ql.link)}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-4 py-2 bg-white border border-gray-200 rounded-full text-xs md:text-sm font-bold ${colors.text} hover:${colors.bg} hover:border-current shadow-sm transition-all flex items-center transform hover:-translate-y-0.5`}
              >
                <i className={`fas ${ql.icon} mr-1.5 opacity-80`}></i> {ql.title}
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  const limit = (appState?.columns || 3) * (appState?.rows || 2);
  const visibleCategories = appState?.categories.slice(0, limit) || [];

  const renderQuickLinks = () => renderQuickLinksBar();

  return (
    <div className="min-h-screen relative flex flex-col justify-between pb-24 text-gray-800">
      {/* Decorative Layer */}
      <NatureBackground />
      <SchoolIllustration />

      {/* Header controls & titles */}
      <header className="relative pt-16 pb-8 z-10 shrink-0">
        {/* Desk Selector Dropdown (Top Left) */}
        {desksMetaList.length > 0 && (
          <div className="absolute top-6 left-6 z-20 flex items-center gap-1.5 bg-white/90 hover:bg-white px-4 py-2.5 rounded-full shadow-md border border-gray-200 transition-all">
            <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
              <i className="fas fa-desktop text-blue-500 mr-1"></i> 도움데스크:
            </span>
            <select
              value={currentSiteId}
              onChange={(e) => {
                setCurrentSiteId(e.target.value);
                setUnlockedEntities(new Set()); // Reset unlocked locks on switch
                setIsMasterUnlocked(false);
              }}
              className="text-xs font-bold text-gray-700 bg-transparent outline-none cursor-pointer border-none focus:ring-0 pr-1 py-0"
            >
              {desksMetaList.map((d) => (
                <option key={d.siteID} value={d.siteID}>
                  {d.siteName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Administrator controls & roles badge (Top Right) */}
        <div className="absolute top-6 right-6 z-20 flex gap-2 items-center">
          {loggedSiteAdmin && (
            <div className="hidden md:flex items-center gap-1.5 bg-blue-100/90 border border-blue-200 text-blue-700 text-xs font-bold px-3 py-2 rounded-full shadow-sm">
              <i className="fas fa-user-circle"></i>
              <span>{loggedSiteAdmin.siteName} 관리자 ({loggedSiteAdmin.adminId})</span>
            </div>
          )}
          {isAdmin && (
            <>
              <div className="hidden md:flex items-center gap-1.5 bg-indigo-100/90 border border-indigo-200 text-indigo-700 text-xs font-bold px-3 py-2 rounded-full shadow-sm animate-pulse">
                <i className="fas fa-crown"></i>
                <span>전체 시스템 관리자</span>
              </div>
              <button
                onClick={() => setIsSuperAdminModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-md transition-all transform hover:scale-105 flex items-center justify-center h-10 w-10"
                title="전체 데이터베이스 관리자 메뉴"
                type="button"
              >
                <i className="fas fa-database"></i>
              </button>
            </>
          )}

          {appState?.masterPassword && appState.masterPassword.trim() !== "" && (
            <button
              onClick={handleMasterLockToggle}
              className="bg-white/90 hover:bg-white p-3 rounded-full shadow-md text-gray-500 hover:text-emerald-500 transition-all transform hover:scale-105 h-10 w-10 flex items-center justify-center"
              title={isMasterUnlocked ? "마스터 권한 잠그기" : "마스터 암호 입력"}
              type="button"
            >
              <i className={`fas ${isMasterUnlocked ? "fa-unlock text-emerald-500" : "fa-key"} text-lg`}></i>
            </button>
          )}
          <button
            onClick={handleGearClick}
            className={`p-3 rounded-full shadow-md transition-all h-10 w-10 flex items-center justify-center ${
              isCurrentDeskEditable
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-white/90 hover:bg-white text-gray-500 hover:text-blue-600"
            }`}
            title="설정 메뉴 열기"
            type="button"
          >
            <i className="fas fa-cog text-xl"></i>
          </button>
        </div>

        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1
            onClick={() => window.location.reload()}
            className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight cursor-pointer hover:text-blue-600 transition-colors inline-block"
            title="초기화면으로 돌아가기"
          >
            {appState?.pageTitle}
          </h1>
          <p className="text-gray-500 mt-3 text-base md:text-lg mb-4">{appState?.pageDescription}</p>

          {/* QuickLinks: Top location */}
          {appState && appState.quickLinkPosition === "top" && renderQuickLinks()}
        </div>
      </header>

      {/* Main Grid View */}
      <main className="max-w-6xl w-full mx-auto px-4 pb-12 z-10 flex-1 flex flex-col justify-start">
        <div
          className={`grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-${appState?.columns || 3}`}
        >
          {visibleCategories.map((cat, idx) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              index={idx}
              isMasterUnlocked={isMasterUnlocked}
              unlockedEntities={unlockedEntities}
              onCategoryClick={handleCategoryClick}
              onGroupClick={handleGroupClick}
              onItemClick={handleItemClick}
              onPostClick={handlePostDirectClick}
              onCheckTodoMain={handleCheckTodoMain}
              columns={appState?.columns || 3}
            />
          ))}
          {visibleCategories.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
              <i className="fas fa-exclamation-circle text-3xl mb-3 text-gray-300"></i>
              <p>설정된 메인 메뉴가 없습니다.</p>
            </div>
          )}
        </div>

        {/* QuickLinks: Bottom location */}
        {appState && appState.quickLinkPosition === "bottom" && renderQuickLinks()}
      </main>

      {/* Persistent Footer */}
      <footer className="bg-white/60 backdrop-blur-md border-t border-gray-200/50 fixed bottom-0 left-0 w-full flex items-center justify-between z-10 shrink-0">
        <div className="max-w-6xl w-full mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-center gap-1.5">
          <p className="text-center text-gray-500 text-sm font-medium">
            {appState?.copyright}
            {appState?.contactEmail && (
              <>
                <span className="mx-2">|</span>
                문의:{" "}
                <a
                  href={`mailto:${appState.contactEmail}`}
                  className="hover:text-blue-500 font-bold underline underline-offset-2 transition-colors"
                >
                  {appState.contactEmail}
                </a>
              </>
            )}
          </p>
        </div>
      </footer>

      {/* --- Overlay Modals & Dialogs --- */}

      {/* 1. Category Board Modal */}
      {selectedBoardCategory && (
        <BoardModal
          category={selectedBoardCategory}
          isAdmin={isCurrentDeskEditable}
          onClose={() => {
            setSelectedBoardCategory(null);
            setDirectPostId(null);
          }}
          onSave={handleSaveCategoryInModal}
          onOpenAdminLogin={() => setIsLoginModalOpen(true)}
          showToast={showToast}
          initialPostId={directPostId}
          onClearInitialPostId={() => setDirectPostId(null)}
        />
      )}

      {/* 2. Category Todo Modal */}
      {selectedTodoCategory && (
        <TodoModal
          category={selectedTodoCategory}
          isAdmin={isCurrentDeskEditable}
          onClose={() => setSelectedTodoCategory(null)}
          onSave={handleSaveCategoryInModal}
          onOpenAdminLogin={() => setIsLoginModalOpen(true)}
          showToast={showToast}
        />
      )}

      {/* 3. Settings Modal */}
      {isSettingsModalOpen && appState && (
        <AdminSettingsModal
          appState={appState}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={handleSaveState}
          onLogout={handleLogout}
          showToast={showToast}
          currentSiteId={currentSiteId}
        />
      )}

      {/* 4. Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        desksMetaList={desksMetaList}
        onSiteAdminSuccess={(siteID, siteName, adminId) => {
          setLoggedSiteAdmin({ siteID, siteName, adminId });
          setCurrentSiteId(siteID);
          showToast(`'${siteName}' 사이트 관리자로 로그인했습니다.`, "success");
          setIsSettingsModalOpen(true);
        }}
        onSuperAdminSuccess={(msg) => {
          setIsAdmin(true);
          showToast(msg, "success");
          setIsSettingsModalOpen(true);
        }}
        onError={(msg) => showToast(msg, "error")}
      />

      {/* 4.1. Super Admin (Global DB) Modal */}
      {isSuperAdminModalOpen && (
        <SuperAdminModal
          isOpen={isSuperAdminModalOpen}
          onClose={() => setIsSuperAdminModalOpen(false)}
          desksMetaList={desksMetaList}
          showToast={showToast}
          onRefreshDesks={() => {}}
          onLogout={handleLogout}
        />
      )}

      {/* 5. Gated Passcode modal */}
      {isPasswordModalOpen && (
        <PasswordModal
          onClose={() => {
            setIsPasswordModalOpen(false);
            setPendingTarget(null);
          }}
          onSubmit={handlePasswordSubmit}
          title={pendingTarget?.type === "master" ? "마스터 권한 해제" : "잠긴 항목"}
          subtitle={
            pendingTarget?.type === "master"
              ? "전체 잠금을 일괄 해제하기 위해 마스터 암호를 입력하세요."
              : "이 내용을 확인하기 위해 암호를 입력하세요."
          }
        />
      )}

      {/* 6. Active notification toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
