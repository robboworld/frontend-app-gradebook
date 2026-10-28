/**
 * Copyright (C) 2024-2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 * Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
 */
// Gradebook: same file as frontend-app-profile/src/robbo-layout; its footer links keep their rel.
/* eslint-disable react/jsx-no-target-blank */
import React from 'react';
import PropTypes from 'prop-types';
import { getConfig } from '@edx/frontend-platform';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import { AppContext } from '@edx/frontend-platform/react';

import RobboStackBadge from './stackBadge';
import RobboWhatsNew from './whatsNew';
import './index.scss';
import fasieLogo from './fasie-logo.png';
import { getRobboLkHeaderNavItem, useRobboAccountActive } from './lkNav';
import RobboLkLockedItem from './lkLockedItem';
import RobboNavIcon from './navIcon';

const MOBILE_COLLAPSE_NAV_QUERY = '(max-width: 767.98px)';

function useMatchMedia(query) {
  const [matches, setMatches] = React.useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

const buildUrl = (baseUrl, path) => {
  if (!baseUrl) {
    return path;
  }
  return `${baseUrl.replace(/\/$/, '')}${path}`;
};

const getDashboardUrl = (config) => (
  config.LEARNER_HOME_MFE_URL
  || config.LEARNER_DASHBOARD_URL
  || buildUrl(config.LMS_BASE_URL, '/dashboard')
);

// LMS `/courses` first: Tutor often sets COURSE_SEARCH_URL to the learner app (same as dashboard).
const getCatalogUrl = (config) => (
  (config.LMS_BASE_URL && buildUrl(config.LMS_BASE_URL, '/courses'))
  || config.COURSE_SEARCH_URL
  || config.COURSE_CATALOG_URL
  || ''
);

const getProgramsUrl = (config) => buildUrl(config.LMS_BASE_URL, '/dashboard/programs');

const getStudioUrl = (config) => {
  const base = config.STUDIO_BASE_URL || config.CMS_BASE_URL || '';
  return base ? String(base).replace(/\/$/, '') : '';
};

/** Account MFE uses PUBLIC_PATH `/account/`; basename requires a trailing slash. */
const getAccountSettingsUrl = (config) => {
  const base = config.ACCOUNT_SETTINGS_URL;
  if (!base) {
    return null;
  }
  return base.endsWith('/') ? base : `${base}/`;
};

export const RobboHeader = ({
  activeSection,
  onCatalogClick,
  showUserDropdown,
  collapseNavIntoUserMenuOnNarrow,
}) => {
  const { authenticatedUser } = React.useContext(AppContext);
  const isAccountActive = useRobboAccountActive(authenticatedUser);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef(null);
  const userMenuToggleRef = React.useRef(null);
  // Learners: «Что нового» lives in the profile menu (state from the LMS widget, whatsNew.jsx).
  const [whatsNew, setWhatsNew] = React.useState(null);
  const whatsNewInMenu = Boolean(whatsNew && whatsNew.inMenu);
  const isNarrowViewport = useMatchMedia(MOBILE_COLLAPSE_NAV_QUERY);
  const collapseMainNav = Boolean(collapseNavIntoUserMenuOnNarrow && isNarrowViewport);
  const intl = useIntl();
  const config = getConfig();
  const dashboardUrl = getDashboardUrl(config);
  const catalogUrl = getCatalogUrl(config);
  const studioUrl = getStudioUrl(config);
  const username = authenticatedUser?.username || authenticatedUser?.name || '';
  // LMS studio_header_link: superuser / global staff only (`administrator` in JWT).
  const showStudioLink = Boolean(studioUrl && authenticatedUser?.administrator);

  const mainLinks = [
    {
      href: dashboardUrl,
      messageId: 'robbo.header.mainNav.myCourses',
      section: 'dashboard',
    },
    ...(config.ENABLE_PROGRAMS ? [{
      href: getProgramsUrl(config),
      messageId: 'robbo.header.mainNav.programs',
      section: 'programs',
    }] : []),
    {
      href: catalogUrl,
      messageId: 'robbo.header.mainNav.courseCatalog',
      onClick: onCatalogClick,
      section: 'catalog',
    },
  ];
  const lkNavItem = getRobboLkHeaderNavItem(config, { locked: !isAccountActive });
  if (lkNavItem) {
    mainLinks.push(lkNavItem);
  }

  const accountSettingsUrl = getAccountSettingsUrl(config);

  // Profile → Account → Sign Out (dashboard link omitted — Robbo).
  const userMenuLinks = [
    username && config.ACCOUNT_PROFILE_URL ? {
      href: `${config.ACCOUNT_PROFILE_URL}/u/${username}`,
      messageId: 'robbo.header.user.profile',
    } : null,
    accountSettingsUrl ? {
      href: accountSettingsUrl,
      messageId: 'robbo.header.user.account',
    } : null,
    config.LOGOUT_URL ? {
      href: config.LOGOUT_URL,
      messageId: 'robbo.header.user.signOut',
    } : null,
  ].filter(Boolean);

  React.useEffect(() => {
    if (!isUserMenuOpen) {
      return undefined;
    }
    const handlePointerDown = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isUserMenuOpen]);

  const headerClassName = ['robbo-layout-header'];
  if (collapseMainNav) {
    headerClassName.push('robbo-layout-header--nav-collapsed');
  }

  return (
    <header className={headerClassName.join(' ')}>
      <div className="robbo-layout-header__inner">
        <div className="robbo-layout-header__leading">
          <RobboStackBadge className="robbo-layout-header__stack-badge" />
          <a className="robbo-layout-header__brand" href={catalogUrl} aria-label="РОББО">
            <span className="robbo-layout-header__wordmark">
              РОББО
              <sup className="robbo-layout-header__reg" aria-hidden="true">®</sup>
            </span>
          </a>
        </div>
        <nav
          className="robbo-layout-header__nav"
          hidden={collapseMainNav}
          aria-hidden={collapseMainNav}
          aria-label={intl.formatMessage({
            id: 'robbo.header.mainNav.aria',
            defaultMessage: 'Main navigation',
          })}
        >
          {mainLinks.map((item) => (item.locked ? (
            <RobboLkLockedItem key={`${item.href}-${item.messageId}`} messageId={item.messageId} />
          ) : (
            <a
              key={`${item.href}-${item.messageId}`}
              className={activeSection === item.section ? 'robbo-layout-header__link active' : 'robbo-layout-header__link'}
              href={item.href}
              onClick={item.onClick}
              aria-current={activeSection === item.section ? 'page' : undefined}
            >
              <RobboNavIcon section={item.section} />
              <FormattedMessage id={item.messageId} />
            </a>
          )))}
        </nav>
        <div className="robbo-layout-header__trailing">
          {username && (
            <RobboWhatsNew
              className="robbo-layout-header__whats-new"
              profileToggleRef={showUserDropdown ? userMenuToggleRef : undefined}
              onChange={setWhatsNew}
            />
          )}
          {showStudioLink && (
            <div
              className="robbo-header-studio-link"
              hidden={collapseMainNav}
              aria-hidden={collapseMainNav}
            >
              <a
                className="robbo-header-studio-link__btn"
                href={studioUrl}
                aria-label={intl.formatMessage({
                  id: 'robbo.header.studio.aria',
                  defaultMessage: 'Go to Studio',
                })}
              >
                <FormattedMessage
                  id="robbo.header.studio.label"
                  defaultMessage="Studio"
                />
              </a>
            </div>
          )}
          {showUserDropdown && username && (
            <div className="robbo-layout-user-menu" ref={userMenuRef}>
              <button
                ref={userMenuToggleRef}
                className={[
                  'robbo-layout-user-menu__toggle',
                  collapseMainNav ? 'robbo-layout-user-menu__toggle--hamburger' : '',
                  collapseMainNav && isUserMenuOpen ? 'open' : '',
                ].filter(Boolean).join(' ')}
                type="button"
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                aria-label={intl.formatMessage({
                  id: 'robbo.header.user.toggleAria',
                  defaultMessage: 'Options Menu',
                })}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                {collapseMainNav ? (
                  <span className="robbo-layout-user-menu__hamburger" aria-hidden="true">
                    <span className="robbo-layout-user-menu__hamburger-line" />
                    <span className="robbo-layout-user-menu__hamburger-line" />
                    <span className="robbo-layout-user-menu__hamburger-line" />
                    <span className="robbo-layout-user-menu__hamburger-line" />
                  </span>
                ) : (
                  <span className="robbo-layout-user-menu__label">{username}</span>
                )}
                {whatsNewInMenu && whatsNew.unread > 0 && <span className="robbo-wn-dot" aria-hidden="true" />}
              </button>
              {isUserMenuOpen && (
                <div
                  className="robbo-layout-user-menu__dropdown"
                  role="menu"
                  aria-label={intl.formatMessage({
                    id: 'robbo.header.user.menuDropdownAria',
                    defaultMessage: 'More Options',
                  })}
                >
                  {collapseMainNav && mainLinks.map((item) => (item.locked ? (
                    <RobboLkLockedItem
                      key={`menu-${item.href}-${item.messageId}`}
                      messageId={item.messageId}
                      variant="menu"
                    />
                  ) : (
                    <a
                      key={`menu-${item.href}-${item.messageId}`}
                      className={
                        ['robbo-layout-user-menu__item', 'robbo-layout-user-menu__item--main-nav',
                          activeSection === item.section ? 'active' : ''].filter(Boolean).join(' ')
                      }
                      href={item.href}
                      role="menuitem"
                      onClick={item.onClick}
                      aria-current={activeSection === item.section ? 'page' : undefined}
                    >
                      <FormattedMessage id={item.messageId} />
                    </a>
                  )))}
                  {collapseMainNav && showStudioLink && (
                    <a
                      className="robbo-layout-user-menu__item robbo-layout-user-menu__item--main-nav"
                      href={studioUrl}
                      role="menuitem"
                    >
                      <FormattedMessage
                        id="robbo.header.studio.label"
                        defaultMessage="Studio"
                      />
                    </a>
                  )}
                  {userMenuLinks.map((item) => (
                    <React.Fragment key={`${item.href}-${item.messageId}`}>
                      {item.messageId === 'robbo.header.user.signOut' && whatsNewInMenu && (
                        <a
                          className="robbo-layout-user-menu__item robbo-layout-user-menu__item--whats-new"
                          href={`${config.LMS_BASE_URL}/whats-new`}
                          role="menuitem"
                          aria-label={whatsNew.label || undefined}
                          onClick={(event) => {
                            event.preventDefault();
                            setIsUserMenuOpen(false);
                            whatsNew.open();
                          }}
                        >
                          <FormattedMessage id="robbo.header.user.whatsNew" defaultMessage="What's new" />
                          {whatsNew.unread > 0 && (
                            <span className="robbo-wn-count" aria-hidden="true">
                              {whatsNew.unread > 9 ? '9+' : whatsNew.unread}
                            </span>
                          )}
                        </a>
                      )}
                      <a
                        className="robbo-layout-user-menu__item"
                        href={item.href}
                        role="menuitem"
                      >
                        <FormattedMessage id={item.messageId} />
                      </a>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

RobboHeader.propTypes = {
  activeSection: PropTypes.oneOf(['catalog', 'dashboard', 'programs']),
  onCatalogClick: PropTypes.func,
  showUserDropdown: PropTypes.bool,
  /** Profile (LMS-like): logo + user only in bar; main nav links move into user menu ≤768px */
  collapseNavIntoUserMenuOnNarrow: PropTypes.bool,
};

RobboHeader.defaultProps = {
  activeSection: null,
  onCatalogClick: undefined,
  showUserDropdown: true,
  collapseNavIntoUserMenuOnNarrow: false,
};

const FooterMailIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FooterGlobeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <path d="M3 12h18M12 3c2.5 2.8 2.5 14.2 0 18M12 3c-2.5 2.8-2.5 14.2 0 18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
  </svg>
);

export const RobboFooter = () => (
  <div className="wrapper wrapper-footer">
    <footer id="footer" className="robbo-site-footer">
      <div className="robbo-site-footer__inner">
        <div className="robbo-footer__main">
          <div className="robbo-footer__brand-col">
            <div className="robbo-footer__brand">
              <span className="robbo-footer__logo" aria-label="РОББО">
                РОББО
                <sup className="robbo-footer__reg" aria-hidden="true">®</sup>
              </span>
            </div>
            <p className="robbo-footer__tagline">Образовательная платформа РОББО</p>
            <p className="robbo-footer__copyright">
              © ООО «РОББО ТЕХНОЛОГИИ», {new Date().getFullYear()}
            </p>
          </div>
          <div className="robbo-footer__partner-col">
            <div className="robbo-footer__partner">
              <a
                className="robbo-footer__partner-link"
                href="https://fasie.ru"
                target="_blank"
                rel="noopener"
              >
                <img
                  className="robbo-footer__partner-logo"
                  src={fasieLogo}
                  alt="Фонд содействия инновациям"
                />
              </a>
            </div>
          </div>
          <nav className="robbo-footer__col" aria-label="Документы">
            <h2 className="robbo-footer__heading">Документы</h2>
            <ul className="robbo-footer__links">
              <li>
                <a href="https://robbo.ru/wp-content/uploads/policy.pdf" target="_blank" rel="noopener" style={{ textDecoration: 'underline' }}>
                  Политика обработки персональных данных
                </a>
              </li>
              <li>
                <a href="https://robbo.ru/wp-content/uploads/agree.pdf" target="_blank" rel="noopener" style={{ textDecoration: 'underline' }}>
                  Согласие на обработку персональных данных
                </a>
              </li>
            </ul>
          </nav>
          <div className="robbo-footer__col robbo-footer__contacts-col">
            <h2 className="robbo-footer__heading">Контакты</h2>
            <ul className="robbo-footer__contacts-list">
              <li className="robbo-footer__contacts-item">
                <span className="robbo-footer__contacts-icon" aria-hidden="true">
                  <FooterMailIcon />
                </span>
                <a
                  className="robbo-footer__contacts-link"
                  href="mailto:info@robbo.ru"
                  aria-label="Почта: info@robbo.ru"
                >
                  info@robbo.ru
                </a>
              </li>
              <li className="robbo-footer__contacts-item">
                <span className="robbo-footer__contacts-icon" aria-hidden="true">
                  <FooterGlobeIcon />
                </span>
                <a
                  className="robbo-footer__contacts-link"
                  href="https://robbo.ru"
                  target="_blank"
                  rel="noopener"
                  style={{ textDecoration: 'underline' }}
                  aria-label="Наш сайт: robbo.ru"
                >
                  robbo.ru
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  </div>
);

export default RobboHeader;
