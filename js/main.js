/**
 * main.js
 * - 모바일 네비게이션 토글
 * - 데이터(products-data.js) 기반 카테고리/제품 렌더링
 * - 제품 목록 페이지 카테고리 필터
 * - 문의 폼 처리
 * 각 기능은 해당 요소가 페이지에 있을 때만 동작하므로, 모든 페이지에서 공용으로 사용합니다.
 */

(function () {
  "use strict";

  const data = window.NETBIX_DATA || { CATEGORIES: [], PRODUCTS: [] };
  const { CATEGORIES, PRODUCTS } = data;

  /* ---------- 문의 폼 → 이메일 전송 설정 (Web3Forms) ----------
   * 정적 사이트에서 백엔드 없이 메일을 보내기 위해 Web3Forms 를 사용합니다.
   * 1) https://web3forms.com 에서 받는 메일 주소(a01095895690@gmail.com)로 Access Key 발급
   * 2) 아래 WEB3FORMS_ACCESS_KEY 값을 발급받은 키로 교체
   * 키 발급 후 별도 서버 없이 폼 제출 → 위 주소로 메일이 자동 전송됩니다.
   */
  const WEB3FORMS_ACCESS_KEY = "57cc4300-8810-4097-89d7-a27c0b58a604";
  const CONTACT_TO_EMAIL = "a01095895690@gmail.com";

  /* ---------- 카테고리 이름 조회 헬퍼 ---------- */
  const catName = (id) => {
    const c = CATEGORIES.find((x) => x.id === id);
    return c ? c.name : id;
  };

  /* ---------- 카드 템플릿 ---------- */
  function categoryCardHTML(cat) {
    return `
      <a class="card cat-card" href="products.html?cat=${cat.id}">
        <div class="cat-icon" aria-hidden="true">${cat.icon}</div>
        <span class="cat-short">${cat.short}</span>
        <h3>${cat.name}</h3>
        <p>${cat.desc}</p>
        <span class="cat-link">제품 보기</span>
      </a>`;
  }

  function productCardHTML(p) {
    const specs = (p.specs || []).map((s) => `<li>${s}</li>`).join("");
    const featured = p.featured ? `<span class="badge-featured">대표 제품</span>` : "";
    return `
      <article class="card product-card" data-category="${p.category}">
        <div class="product-top">
          <div>
            ${featured}
            <h3>${p.name}</h3>
            <p class="product-tagline">${p.tagline}</p>
          </div>
          <span class="product-model">${p.model}</span>
        </div>
        <p class="product-desc">${p.desc}</p>
        <ul class="product-specs">${specs}</ul>
        <p class="product-cat-tag">분류 · ${catName(p.category)}</p>
      </article>`;
  }

  /* ---------- 1. 모바일 네비게이션 ---------- */
  function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => nav.classList.remove("open"));
    });
  }

  /* ---------- 2. 홈: 카테고리 렌더 ---------- */
  function renderHomeCategories() {
    const el = document.getElementById("category-grid");
    if (!el) return;
    el.innerHTML = CATEGORIES.map(categoryCardHTML).join("");
  }

  /* ---------- 3. 홈: 대표 제품 렌더 ---------- */
  function renderFeaturedProducts() {
    const el = document.getElementById("featured-grid");
    if (!el) return;
    el.innerHTML = PRODUCTS.filter((p) => p.featured).map(productCardHTML).join("");
  }

  /* ---------- 4. 제품 목록 페이지: 필터 ---------- */
  function initProductsPage() {
    const grid = document.getElementById("products-grid");
    const filterBar = document.getElementById("filter-bar");
    if (!grid || !filterBar) return;

    const countEl = document.getElementById("result-count");

    // 필터 버튼 생성 (전체 + 각 카테고리)
    const buttons = [{ id: "all", name: "전체" }, ...CATEGORIES];
    filterBar.innerHTML = buttons
      .map(
        (b) =>
          `<button class="filter-btn" data-filter="${b.id}">${b.name}</button>`
      )
      .join("");

    function applyFilter(filter) {
      const list =
        filter === "all"
          ? PRODUCTS
          : PRODUCTS.filter((p) => p.category === filter);

      grid.innerHTML = list.length
        ? list.map(productCardHTML).join("")
        : `<p style="grid-column:1/-1;text-align:center;color:var(--color-text-muted)">해당 분류의 제품이 없습니다.</p>`;

      if (countEl) {
        const label = filter === "all" ? "전체" : catName(filter);
        countEl.textContent = `${label} · 총 ${list.length}개 제품`;
      }

      filterBar.querySelectorAll(".filter-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.filter === filter);
      });
    }

    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      const filter = btn.dataset.filter;
      applyFilter(filter);
      // URL 갱신 (새로고침/공유 대응)
      const url = new URL(window.location);
      if (filter === "all") url.searchParams.delete("cat");
      else url.searchParams.set("cat", filter);
      history.replaceState(null, "", url);
    });

    // URL 파라미터(?cat=)로 초기 필터 결정
    const initial = new URLSearchParams(window.location.search).get("cat");
    const valid = initial && CATEGORIES.some((c) => c.id === initial);
    applyFilter(valid ? initial : "all");
  }

  /* ---------- 5. 문의 폼 ---------- */
  function initContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;

    // 문의 폼의 관심 제품군 select 옵션 채우기
    const select = form.querySelector("#interest");
    if (select) {
      CATEGORIES.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        select.appendChild(opt);
      });
    }

    const success = document.getElementById("form-success");
    const errorBox = document.getElementById("form-error");
    const submitBtn = form.querySelector('button[type="submit"]');

    const showMsg = (box, text) => {
      if (!box) return;
      if (text) box.textContent = text;
      box.classList.add("show");
    };
    const hideMsg = (box) => box && box.classList.remove("show");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideMsg(success);
      hideMsg(errorBox);

      // 키 미설정 가드
      if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === "YOUR_WEB3FORMS_ACCESS_KEY") {
        showMsg(errorBox, "메일 전송 키가 아직 설정되지 않았습니다. 관리자에게 문의해 주세요.");
        return;
      }

      // 허니팟(봇 차단)에 값이 있으면 조용히 무시
      if (form.querySelector('input[name="botcheck"]')?.checked) return;

      // FormData(multipart)는 한글 필드명이 헤더에서 깨지므로 JSON(UTF-8)으로 전송한다.
      const val = (name) => (form.elements[name]?.value || "").trim();
      const interestId = val("interest");
      const payload = {
        access_key: WEB3FORMS_ACCESS_KEY,
        from_name: "NetbiX 홈페이지 문의",
        subject: `[NetbiX 문의] ${val("name") || "이름 미입력"}`,
        name: val("name"),
        email: val("email"),
        "회사/기관": val("company") || "(미입력)",
        "관심 제품군": interestId ? catName(interestId) : "선택 안 함",
        message: val("message"),
      };

      const originalLabel = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "전송 중...";
      }

      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (res.ok && result.success) {
          showMsg(success);
          form.reset();
        } else {
          showMsg(errorBox, "전송에 실패했습니다. 잠시 후 다시 시도하거나 직접 메일로 연락해 주세요.");
        }
      } catch (err) {
        showMsg(errorBox, "네트워크 오류로 전송하지 못했습니다. 인터넷 연결을 확인해 주세요.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
      }
    });
  }

  /* ---------- 초기화 ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    renderHomeCategories();
    renderFeaturedProducts();
    initProductsPage();
    initContactForm();
  });
})();
