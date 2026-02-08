import './Drawer.css';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  userName: string | null;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: 'chat',
    title: 'Q&A',
    description: 'Ask anything about components, tokens, spacing, or accessibility. Get instant answers grounded in the design system.',
  },
  {
    icon: 'search',
    title: 'Scan & Fix',
    description: 'Select any element and scan it for design issues. Get one-click fixes for spacing, contrast, and token mismatches.',
  },
  {
    icon: 'accessibility',
    title: 'Accessibility',
    description: 'Check your designs against WCAG 2.1 AA guidelines. Catch contrast, touch target, and text size issues early.',
  },
  {
    icon: 'palette',
    title: 'Design System',
    description: 'Browse component specs, typography scales, color tokens, and spacing values from the Simple Design System.',
  },
];

export function Drawer({ open, onClose, userName }: DrawerProps) {
  if (!open) return null;

  const firstName = userName ? userName.split(' ')[0] : 'there';

  return (
    <>
      <div class="drawer-backdrop" onClick={onClose} />
      <div class="drawer-panel">
        {/* Header */}
        <div class="drawer-header">
          <div class="drawer-header-top">
            <p class="drawer-greeting">Hi, {firstName}</p>
            <button class="drawer-close" aria-label="Close drawer" onClick={onClose}>
              <span class="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          </div>
        </div>

        {/* Feature descriptions */}
        <div class="drawer-features">
          {FEATURES.map((feature) => (
            <div key={feature.title} class="drawer-feature">
              <div class="drawer-feature-header">
                <span class="material-symbols-outlined drawer-feature-icon">{feature.icon}</span>
                <span class="drawer-feature-title">{feature.title}</span>
              </div>
              <p class="drawer-feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div class="drawer-footer">
          <span class="drawer-version">UX Buddy v2.0</span>
        </div>
      </div>
    </>
  );
}
