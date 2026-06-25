import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError } from "../firebase";
import { DeskMeta, OperationType, AppState, Category } from "../types";

interface SuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  desksMetaList: DeskMeta[];
  showToast: (msg: string, type: "success" | "error") => void;
  onRefreshDesks: () => void;
  onLogout?: () => void;
  onSelectSite?: (siteID: string) => void;
}

export default function SuperAdminModal({
  isOpen,
  onClose,
  desksMetaList,
  showToast,
  onRefreshDesks,
  onLogout,
  onSelectSite,
}: SuperAdminModalProps) {
  const [desks, setDesks] = useState<DeskMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states for creating/editing
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [siteID, setSiteID] = useState("");
  const [siteName, setSiteName] = useState("");
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const isEditing = editingIndex !== null;

  // Load all desks with credentials when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadCredentials = async () => {
      try {
        setLoading(true);
        const credRef = doc(db, "school_settings", "admin_credentials");
        const credSnap = await getDoc(credRef);
        
        let credentialsMap: { [key: string]: { adminId: string; adminPassword?: string } } = {};
        if (credSnap.exists()) {
          const credData = credSnap.data();
          const credentialsList = credData.credentials || [];
          credentialsList.forEach((c: any) => {
            credentialsMap[c.siteID] = {
              adminId: c.adminId || "",
              adminPassword: c.adminPassword || "",
            };
          });
        }

        // Merge password credentials with current desks list
        const mergedDesks = desksMetaList.map((d) => {
          const cred = credentialsMap[d.siteID];
          return {
            ...d,
            adminId: cred?.adminId || d.adminId || "admin",
            adminPassword: cred?.adminPassword || "6245",
          };
        });

        setDesks(mergedDesks);
      } catch (err) {
        console.error("Failed to load credentials:", err);
        showToast("관리자 자격 증명 정보를 불러오는 데 실패했습니다.", "error");
      } finally {
        setLoading(false);
      }
    };

    loadCredentials();
  }, [isOpen, desksMetaList]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingIndex(null);
    setSiteID("");
    setSiteName("");
    setAdminId("");
    setAdminPassword("");
  };

  const handleEditClick = (idx: number) => {
    const d = desks[idx];
    setEditingIndex(idx);
    setSiteID(d.siteID);
    setSiteName(d.siteName);
    setAdminId(d.adminId);
    setAdminPassword(d.adminPassword || "");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanSiteID = siteID.trim().toLowerCase();
    const cleanSiteName = siteName.trim();
    const cleanAdminId = adminId.trim();
    const cleanAdminPassword = adminPassword.trim();

    if (!cleanSiteID || !cleanSiteName || !cleanAdminId || !cleanAdminPassword) {
      showToast("모든 항목을 입력해주세요.", "error");
      return;
    }

    // ID regex validation (alphanumeric/hyphen/underscore)
    if (!/^[a-z0-9_\-]+$/.test(cleanSiteID)) {
      showToast("사이트 ID는 영문 소문자, 숫자, 하이픈(-), 언더바(_)만 가능합니다.", "error");
      return;
    }

    // Check duplicate ID (if not editing current index)
    const duplicateIdx = desks.findIndex((d) => d.siteID === cleanSiteID);
    if (duplicateIdx !== -1 && (!isEditing || duplicateIdx !== editingIndex)) {
      showToast("이미 존재하는 사이트 ID입니다. 고유한 ID를 지정해주세요.", "error");
      return;
    }

    const updatedDesk: DeskMeta = {
      siteID: cleanSiteID,
      siteName: cleanSiteName,
      adminId: cleanAdminId,
      adminPassword: cleanAdminPassword,
    };

    const nextDesks = [...desks];
    if (isEditing && editingIndex !== null) {
      nextDesks[editingIndex] = updatedDesk;
      showToast("데스크 정보가 임시 수정되었습니다.", "success");
    } else {
      nextDesks.push(updatedDesk);
      showToast("새 데스크 정보가 추가되었습니다.", "success");
    }

    setDesks(nextDesks);
    resetForm();
  };

  const handleDeleteDesk = (idx: number) => {
    const target = desks[idx];
    if (target.siteID === "main") {
      showToast("기본 데스크(main)는 삭제할 수 없습니다.", "error");
      return;
    }

    if (!window.confirm(`정말 '${target.siteName} (${target.siteID})' 데스크 매니저를 삭제하시겠습니까?\n이 설정 목록에서 지워지며, 해당 사이트 데이터는 더 이상 관리자 접근이 불가능하게 됩니다.`)) {
      return;
    }

    const nextDesks = desks.filter((_, i) => i !== idx);
    setDesks(nextDesks);
    showToast("데스크 정보가 임시 삭제되었습니다.", "success");
  };

  const handleSaveToDatabase = async () => {
    try {
      setSaving(true);

      // Separate public desk list & credentials
      const publicDesks = desks.map((d) => ({
        siteID: d.siteID,
        siteName: d.siteName,
        adminId: d.adminId,
      }));

      const credentials = desks.map((d) => ({
        siteID: d.siteID,
        adminId: d.adminId,
        adminPassword: d.adminPassword,
      }));

      const adminDesksRef = doc(db, "school_settings", "admin_desks");
      const adminCredsRef = doc(db, "school_settings", "admin_credentials");

      await setDoc(adminDesksRef, { desks: publicDesks });
      await setDoc(adminCredsRef, { credentials });

      showToast("전체 데이터베이스 설정이 클라우드에 영구 저장되었습니다!", "success");
      onRefreshDesks();
      onClose();
    } catch (err) {
      console.error("Failed to save super admin configuration:", err);
      handleFirestoreError(err, OperationType.WRITE, "school_settings/admin_desks");
      showToast("데이터베이스 저장 중 오류가 발생했습니다.", "error");
    } finally {
      setSaving(false);
    }
  };

  const [copyingMainToMasan, setCopyingMainToMasan] = useState(false);

  const handleCopyMainToMasan = async () => {
    if (!window.confirm("정말 '기본 교무실 도움데스크'의 모든 내용(게시물, 일정, 카테고리, 잠금 등)을 '마산중앙초'로 일괄 복사(덮어쓰기)하시겠습니까?\n마산중앙초의 기존 자료 및 메뉴 구조는 모두 덮어써집니다.")) {
      return;
    }
    try {
      setCopyingMainToMasan(true);
      const sourceRef = doc(db, "school_settings", "main");
      const targetRef = doc(db, "school_settings", "msjungang");

      const sourceSnap = await getDoc(sourceRef);
      if (!sourceSnap.exists()) {
        showToast("기본 교무실 도움데스크 데이터가 존재하지 않습니다.", "error");
        return;
      }

      const sourceData = sourceSnap.data();
      const updatedData = {
        ...sourceData,
        pageTitle: "마산중앙초 도움데스크"
      };

      await setDoc(targetRef, updatedData);
      showToast("기본 교무실 도움데스크 내용을 마산중앙초에 일괄 복사했습니다!", "success");
    } catch (err) {
      console.error("Failed to copy desk data:", err);
      showToast("데이터 복사에 실패했습니다.", "error");
    } finally {
      setCopyingMainToMasan(false);
    }
  };

  const [cloneSourceId, setCloneSourceId] = useState("");
  const [cloneTargetId, setCloneTargetId] = useState("");
  const [cloning, setCloning] = useState(false);

  const handleCloneSiteStructure = async () => {
    if (!cloneSourceId || !cloneTargetId) {
      showToast("원본 사이트와 대상 사이트를 모두 선택해주세요.", "error");
      return;
    }
    if (cloneSourceId === cloneTargetId) {
      showToast("원본 사이트와 대상 사이트는 같을 수 없습니다.", "error");
      return;
    }

    const sourceDesk = desks.find((d) => d.siteID === cloneSourceId);
    const targetDesk = desks.find((d) => d.siteID === cloneTargetId);

    if (!sourceDesk || !targetDesk) {
      showToast("선택한 사이트 정보를 찾을 수 없습니다.", "error");
      return;
    }

    try {
      setCloning(true);
      const sourceRef = doc(db, "school_settings", cloneSourceId);
      const targetRef = doc(db, "school_settings", cloneTargetId);

      const sourceSnap = await getDoc(sourceRef);
      if (!sourceSnap.exists()) {
        showToast("원본 사이트 데이터가 존재하지 않습니다. 먼저 설정을 만들어주세요.", "error");
        return;
      }

      const sourceData = sourceSnap.data() as AppState;

      // Clean up posts and todos in each category
      const clonedCategories = (sourceData.categories || []).map((cat: Category) => {
        const newCat = { ...cat };
        if (newCat.type === "board") {
          newCat.posts = [];
        } else if (newCat.type === "todo") {
          newCat.todos = [];
        }
        // Groups under menu represent menu items, we keep them intact
        return newCat;
      });

      const clonedData: AppState = {
        ...sourceData,
        pageTitle: `${targetDesk.siteName} 도움데스크`, // Set target's page title
        categories: clonedCategories,
      };

      await setDoc(targetRef, clonedData);
      showToast(`'${sourceDesk.siteName}'의 메뉴 형식을 '${targetDesk.siteName}'으로 성공적으로 복제했습니다!`, "success");
    } catch (err) {
      console.error("Failed to clone site structure:", err);
      showToast("사이트 복제에 실패했습니다.", "error");
    } finally {
      setCloning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-up">
        {/* Header */}
        <div className="bg-indigo-700 text-white p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/50 rounded-lg flex items-center justify-center text-lg">
              <i className="fas fa-database"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold">전체 데이터베이스 관리자 메뉴</h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                새로운 도움데스크를 생성하고, 각 데스크의 관리자 권한을 부여합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-200 hover:text-white transition-colors"
            type="button"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
              <i className="fas fa-spinner fa-spin text-3xl text-indigo-600"></i>
              <p className="text-sm">관리자 자격 증명을 불러오는 중...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form to Add/Edit */}
              <div className="lg:col-span-5 bg-gray-50 p-5 rounded-xl border border-gray-200 h-fit">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2 pb-2 border-b border-gray-200">
                  <i className="fas fa-plus-circle text-indigo-600"></i>
                  {isEditing ? "데스크 정보 수정" : "새로운 데스크 매니저 생성"}
                </h3>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      사이트 ID (고유 고정 코드)
                    </label>
                    <input
                      type="text"
                      value={siteID}
                      onChange={(e) => setSiteID(e.target.value)}
                      placeholder="예: math, admin_dept (영어/숫자만)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase-only bg-white"
                      disabled={isEditing} // Cannot change siteID after creation
                      required
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      영문 소문자, 숫자, 하이픈(-)만 가능하며 생성 후 변경할 수 없습니다.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      도움데스크 이름 (사이트명)
                    </label>
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="예: 수학교육과 도움데스크"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      지정 관리자 아이디 (Admin ID)
                    </label>
                    <input
                      type="text"
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      placeholder="예: math_admin"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      지정 관리자 비밀번호
                    </label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="비밀번호 설정"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      {isEditing ? "수정 임시적용" : "데스크 추가"}
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="py-2 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Right Column: List of current desks */}
              <div className="lg:col-span-7 flex flex-col h-full">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <i className="fas fa-list text-indigo-600"></i>
                  등록된 도움데스크 목록 ({desks.length}개)
                </h3>

                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white flex-1 min-h-[300px]">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">사이트 ID / 이름</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">관리자 ID</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">비밀번호</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {desks.map((d, idx) => (
                        <tr key={d.siteID} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-800">{d.siteName}</span>
                              {onSelectSite && (
                                <button
                                  onClick={() => {
                                    onSelectSite(d.siteID);
                                    onClose();
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 px-1.5 py-0.5 rounded transition-all cursor-pointer border border-indigo-200"
                                  type="button"
                                  title="바로가기"
                                >
                                  <i className="fas fa-external-link-alt text-[9px]"></i>
                                  바로가기
                                </button>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">{d.siteID}</div>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-600">{d.adminId}</td>
                          <td className="px-4 py-3 text-gray-400 font-mono">
                            {d.adminPassword ? (
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                {d.adminPassword}
                              </span>
                            ) : (
                              "미설정"
                            )}
                          </td>
                          <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleEditClick(idx)}
                              className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              type="button"
                              title="수정"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteDesk(idx)}
                              disabled={d.siteID === "main"}
                              className={`px-2 py-1 ${
                                d.siteID === "main"
                                  ? "text-gray-300 cursor-not-allowed"
                                  : "text-red-500 hover:bg-red-50"
                              } rounded transition-colors`}
                              type="button"
                              title="삭제"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-4 bg-violet-50 border border-violet-100 rounded-xl">
                  <h4 className="text-xs font-bold text-violet-900 mb-1 flex items-center gap-1.5">
                    <i className="fas fa-clone"></i>
                    사이트 메뉴 형식 복제 (구조 복사 및 게시물/할일 비우기)
                  </h4>
                  <p className="text-[11px] text-violet-700 leading-relaxed mb-3">
                    기존 등록된 사이트의 <strong>모든 메뉴 형식과 화면 구성(카테고리, 메뉴, 그룹, 링크, 디자인 설정)</strong>을 다른 사이트로 간편하게 복제합니다.
                    <br />※ <span className="font-semibold text-red-600">주의:</span> 게시판 게시물(Post)과 할 일 목록(Todo)의 개별 데이터는 복제되지 않고 빈 상태로 생성됩니다. (메뉴 형식만 안전하게 복제)
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-violet-800 mb-1">원본 사이트 (복사 대상)</label>
                      <select
                        value={cloneSourceId}
                        onChange={(e) => setCloneSourceId(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-violet-200 bg-white text-gray-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-violet-200 cursor-pointer"
                      >
                        <option value="">-- 원본 사이트 선택 --</option>
                        {desks.map((d) => (
                          <option key={d.siteID} value={d.siteID}>
                            {d.siteName} ({d.siteID})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-violet-800 mb-1">대상 사이트 (덮어쓸 위치)</label>
                      <select
                        value={cloneTargetId}
                        onChange={(e) => setCloneTargetId(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-violet-200 bg-white text-gray-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-violet-200 cursor-pointer"
                      >
                        <option value="">-- 대상 사이트 선택 --</option>
                        {desks.map((d) => (
                          <option key={d.siteID} value={d.siteID}>
                            {d.siteName} ({d.siteID})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleCloneSiteStructure}
                    disabled={cloning || !cloneSourceId || !cloneTargetId || cloneSourceId === cloneTargetId}
                    className="w-full py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    type="button"
                  >
                    {cloning ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        복제 작업 실행 중...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-clone"></i>
                        사이트 메뉴 구성 복제
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center shrink-0">
          <p className="text-xs text-gray-500">
            <i className="fas fa-exclamation-triangle text-amber-500 mr-1"></i>
            수정/추가 사항은 하단의 <strong>[클라우드 영구 저장]</strong> 버튼을 누르셔야 데이터베이스에 최종 반영됩니다.
          </p>
          <div className="flex gap-2">
            {onLogout && (
              <button
                onClick={() => {
                  if (window.confirm("전체 시스템 관리자 계정에서 로그아웃하시겠습니까?")) {
                    onLogout();
                    onClose();
                  }
                }}
                className="px-4 py-2 border border-red-300 hover:bg-red-50 text-red-600 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                type="button"
                disabled={saving}
              >
                <i className="fas fa-sign-out-alt"></i>
                전체 관리자 로그아웃
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-xs transition-colors"
              type="button"
              disabled={saving}
            >
              닫기
            </button>
            <button
              onClick={handleSaveToDatabase}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5"
              type="button"
              disabled={saving || loading}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  저장 중...
                </>
              ) : (
                <>
                  <i className="fas fa-cloud-upload-alt"></i>
                  클라우드 영구 저장
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
