const rootPrefix = window.location.pathname.includes('/blog/') ? '../' : '';

const pagePaths = {
  home: 'index.html',
  projects: 'projects.html',
  resume: 'resume.html',
  blog: 'blog.html',
  hobbies: 'hobbies.html',
  contact: 'contact.html',
};

const loadFragment = async (targetId, filePath, onLoad) => {
  const container = document.getElementById(targetId);
  if (!container) {
    return;
  }

  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load ${filePath}`);
    }
    container.innerHTML = await response.text();
    if (typeof onLoad === 'function') {
      onLoad(container);
    }
  } catch (error) {
    console.error(error);
  }
};

const highlightActiveNav = (container) => {
  const currentPage = document.body.dataset.page;
  Object.entries(pagePaths).forEach(([page, path]) => {
    const link = container.querySelector(`.site-nav [data-nav="${page}"]`);
    if (link) {
      link.href = `${rootPrefix}${path}`;
    }
  });

  if (!currentPage) {
    return;
  }
  const activeLink = container.querySelector(
    `.site-nav [data-nav="${currentPage}"]`
  );
  if (activeLink) {
    activeLink.classList.add('active');
  }
};

const updateFooterYear = (container) => {
  const yearEl = container.querySelector('#year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
};

const slugifyTag = (tag) =>
  tag
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const getPostSummary = (postDocument) => {
  const heroParagraphs = Array.from(
    postDocument.querySelectorAll('.page-hero p')
  );
  const summary = heroParagraphs.find(
    (paragraph) => !paragraph.classList.contains('section-eyebrow')
  );

  return summary ? summary.textContent.trim() : '';
};

const createBlogFilterButton = (label, filter, isActive = false) => {
  const button = document.createElement('button');
  button.className = 'blog-filter__button';
  button.type = 'button';
  button.dataset.blogFilter = filter;
  button.setAttribute('aria-pressed', String(isActive));
  button.textContent = label;

  if (isActive) {
    button.classList.add('active');
  }

  return button;
};

const blogFilters = [
  { label: 'All', filter: 'all' },
  { label: 'Academic', filter: 'academic' },
  { label: 'Technology', filter: 'technology' },
  { label: 'Case Study', filter: 'case-study' },
];

const createBlogCard = ({ post, title, summary }) => {
  const article = document.createElement('article');
  article.className = 'project-card blog-card';
  article.dataset.tags = post.tags.map(slugifyTag).join(' ');

  const body = document.createElement('div');
  body.className = 'project-card__body';

  const tags = document.createElement('div');
  tags.className = 'blog-card__tags';
  tags.setAttribute('aria-label', 'Post tags');
  post.tags.forEach((tag) => {
    const tagEl = document.createElement('span');
    tagEl.textContent = tag;
    tags.append(tagEl);
  });

  const heading = document.createElement('h3');
  heading.textContent = title;

  const excerpt = document.createElement('p');
  excerpt.textContent = summary;

  const actions = document.createElement('div');
  actions.className = 'project-card__actions';

  const link = document.createElement('a');
  link.className = 'btn btn--ghost';
  link.href = post.url;
  link.textContent = 'Read more';
  actions.append(link);

  body.append(tags, heading, excerpt, actions);
  article.append(body);

  return article;
};

const renderBlogIndex = async () => {
  const filterContainer = document.querySelector('[data-blog-filters]');
  const postsContainer = document.querySelector('[data-blog-posts]');
  if (!filterContainer || !postsContainer) {
    return;
  }

  try {
    const postsResponse = await fetch(`${rootPrefix}blog/posts.json?v=2`, {
      cache: 'no-store',
    });
    if (!postsResponse.ok) {
      throw new Error('Failed to load blog posts.');
    }

    const posts = await postsResponse.json();

    filterContainer.replaceChildren(
      ...blogFilters.map(({ label, filter }, index) =>
        createBlogFilterButton(label, filter, index === 0)
      )
    );

    const cards = await Promise.all(
      posts.map(async (post) => {
        const response = await fetch(post.url);
        if (!response.ok) {
          throw new Error(`Failed to load ${post.url}`);
        }

        const html = await response.text();
        const postDocument = new DOMParser().parseFromString(html, 'text/html');
        const postHeading = postDocument.querySelector('.page-hero h1');
        const title =
          postHeading && postHeading.textContent.trim()
            ? postHeading.textContent.trim()
            : 'Untitled post';
        const summary = getPostSummary(postDocument);

        return createBlogCard({ post, title, summary });
      })
    );

    postsContainer.replaceChildren(...cards);
    initBlogFilters();
    applyBlogFilter(blogFilters[0].filter);
  } catch (error) {
    console.error(error);
    postsContainer.textContent = 'Blog posts could not be loaded.';
  }
};

const applyBlogFilter = (activeFilter) => {
  const filterButtons = document.querySelectorAll('[data-blog-filter]');
  const blogCards = document.querySelectorAll('.blog-card[data-tags]');

  filterButtons.forEach((filterButton) => {
    const isActive = filterButton.dataset.blogFilter === activeFilter;
    filterButton.classList.toggle('active', isActive);
    filterButton.setAttribute('aria-pressed', String(isActive));
  });

  blogCards.forEach((card) => {
    const tags = card.dataset.tags.split(' ');
    const shouldHide = activeFilter !== 'all' && !tags.includes(activeFilter);
    card.classList.toggle('is-hidden', shouldHide);
    card.hidden = shouldHide;
  });
};

const initBlogFilters = () => {
  const filterButtons = document.querySelectorAll('[data-blog-filter]');
  const blogCards = document.querySelectorAll('.blog-card[data-tags]');
  if (!filterButtons.length || !blogCards.length) {
    return;
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      applyBlogFilter(button.dataset.blogFilter);
    });
  });
};

const initPage = () => {
  loadFragment(
    'site-header',
    `${rootPrefix}partials/header.html`,
    highlightActiveNav
  );
  loadFragment(
    'site-footer',
    `${rootPrefix}partials/footer.html`,
    updateFooterYear
  );
  renderBlogIndex();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPage);
} else {
  initPage();
}
