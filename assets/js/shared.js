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

document.addEventListener('DOMContentLoaded', () => {
  loadFragment('site-header', 'partials/header.html', highlightActiveNav);
  loadFragment('site-footer', 'partials/footer.html', updateFooterYear);
});
