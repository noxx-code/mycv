// github-repos.js
// Fetch public repositories for a GitHub user and render them as Bootstrap cards.
// - Uses fetch + async/await
// - Sorts by most recently updated
// - Limits to top 6 repos
// - Shows loading spinner and error handling

/**
 * github-repos.js (cleaned)
 * - Single IIFE
 * - Clear error handling and rate-limit feedback
 * - Accessible controls wiring
 * - Client-side filtering and search
 */

(function(){
  const USERNAME = 'noxx-code';
  const API = `https://api.github.com/users/${USERNAME}/repos?per_page=100`;
  const MAX_REPOS = 6;

  const spinner = document.getElementById('repos-spinner');
  const container = document.getElementById('repos-container');
  const errorBox = document.getElementById('repos-error');
  const searchInput = document.getElementById('repos-search');
  const filtersContainer = document.getElementById('repos-filters');

  let reposCache = [];
  let activeLanguage = 'All';

  function safeText(s){ return String(s||''); }

  function formatDate(iso){
    try{ return new Date(iso).toLocaleString(); } catch(e){ return iso; }
  }

  function createLangBadge(lang){
    const span = document.createElement('span');
    span.className = 'lang-badge';
    span.textContent = lang;
    span.setAttribute('aria-hidden','true');
    return span;
  }

  function createRepoCard(repo, index){
    const name = safeText(repo.name || 'untitled');
    const desc = safeText(repo.description || '');
    const lang = safeText(repo.language || 'Unknown');
    const stars = repo.stargazers_count || 0;
    const updated = formatDate(repo.updated_at);
    const url = safeText(repo.html_url || '#');

    const column = document.createElement('div');
    column.className = 'col-12 col-md-6 col-lg-4';

    const card = document.createElement('article');
    card.className = 'card h-100 repo-card load-anim';
    card.style.animationDelay = `${index * 80}ms`;
    card.setAttribute('tabindex','0');

    card.innerHTML = `
      <div class="card-body d-flex flex-column">
        <h3 class="card-title" style="margin:0;font-size:1.05rem"><a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a></h3>
        <p class="card-text mb-2" style="color:var(--muted)">${desc}</p>
        <div class="mt-auto">
          <div class="d-flex justify-content-between meta align-items-center">
            <div>
              <span class="me-2">★ ${stars}</span>
            </div>
            <div class="text-end">
              <div style="font-size:0.85rem;color:var(--muted)">${updated}</div>
              <a class="button-link" href="${url}" target="_blank" rel="noopener noreferrer" style="margin-top:6px">View on GitHub</a>
            </div>
          </div>
        </div>
      </div>
    `;

    const badge = createLangBadge(lang);
    const body = card.querySelector('.card-body');
    const ref = body.querySelector('.card-text');
    if(ref) body.insertBefore(badge, ref);
    else body.appendChild(badge);

    column.appendChild(card);
    return column;
  }

  function clearRepos(){ if(container) container.innerHTML = ''; }

  function renderRepos(list){
    clearRepos();
    (list || []).forEach((r, idx) => {
      const card = createRepoCard(r, idx);
      container.appendChild(card);
    });
  }

  function populateLanguageFilters(repos){
    const langs = new Set();
    repos.forEach(r=>{ if(r.language) langs.add(r.language); });
    const sorted = Array.from(langs).sort();

    filtersContainer.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.type = 'button';
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', ()=> setLanguageFilter('All'));
    filtersContainer.appendChild(allBtn);

    sorted.forEach(lang => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.type = 'button';
      btn.textContent = lang;
      btn.addEventListener('click', ()=> setLanguageFilter(lang));
      filtersContainer.appendChild(btn);
    });
  }

  function setLanguageFilter(lang){
    activeLanguage = lang;
    Array.from(filtersContainer.children).forEach(btn=>{
      btn.classList.toggle('active', btn.textContent === lang);
    });
    applyFilters();
  }

  function applyFilters(){
    const q = (searchInput && searchInput.value ? searchInput.value.toLowerCase().trim() : '');
    const filtered = reposCache.filter(r=>{
      if(activeLanguage !== 'All' && (r.language||'') !== activeLanguage) return false;
      if(!q) return true;
      const hay = (r.name + ' ' + (r.description||'')).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
    renderRepos(filtered.slice(0, MAX_REPOS));
  }

  // Check rate limit headers and display a friendly message when near limit
  function checkRateLimit(response){
    try{
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const reset = response.headers.get('X-RateLimit-Reset');
      if(remaining !== null && Number(remaining) <= 0){
        const resetDate = reset ? new Date(Number(reset)*1000) : null;
        errorBox.style.display = 'block';
        errorBox.textContent = 'GitHub API rate limit exceeded. Try again later' + (resetDate ? ' — resets at ' + resetDate.toLocaleTimeString() : '.') ;
        return true;
      }
    }catch(e){/* ignore */}
    return false;
  }

  async function fetchRepos(){
    if(!container) return;
    try{
      const res = await fetch(API, {headers: {'Accept': 'application/vnd.github.v3+json'}});
      if(!res.ok){
        // try to surface JSON error message if present
        let msg = `GitHub API error: ${res.status}`;
        try{ const body = await res.json(); if(body && body.message) msg += ' — ' + body.message; }catch(e){}
        throw new Error(msg);
      }

      if(checkRateLimit(res)) return;

      const data = await res.json();
      reposCache = data.sort((a,b)=> new Date(b.updated_at) - new Date(a.updated_at));

      if(reposCache.length === 0){
        errorBox.style.display = 'block';
        errorBox.textContent = 'No public repositories found.';
        return;
      }

      populateLanguageFilters(reposCache);
      applyFilters();

    }catch(err){
      console.error('Failed to fetch repos', err);
      if(errorBox){ errorBox.style.display = 'block'; errorBox.textContent = 'Failed to load repositories. ' + (err.message || ''); }
    }finally{
      if(spinner) spinner.style.display = 'none';
    }
  }

  if(searchInput){
    let timeout = null;
    searchInput.addEventListener('input', ()=>{
      clearTimeout(timeout);
      timeout = setTimeout(()=> applyFilters(), 200);
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fetchRepos);
  else fetchRepos();

})();
