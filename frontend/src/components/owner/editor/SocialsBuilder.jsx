import React from 'react';
import {
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
  TwitterIcon,
  LinkIcon,
  ShoppingBagIcon,
  MailIcon,
  GlobeIcon,
  PlusIcon,
  TrashIcon,
  MoveUpIcon,
  MoveDownIcon,
  ExternalLinkIcon,
  CheckIcon,
} from '../../Icons';

const AVAILABLE_PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: InstagramIcon,
    domain: 'instagram.com/',
    prefix: 'https://instagram.com/',
    placeholder: 'username (tanpa @)',
    badgeColor: 'bg-rose-50 text-rose-600 border-rose-200',
    btnBg: 'hover:border-rose-300 hover:bg-rose-50/50',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: TikTokIcon,
    domain: 'tiktok.com/@',
    prefix: 'https://tiktok.com/@',
    placeholder: 'username (tanpa @)',
    badgeColor: 'bg-slate-900 text-white border-slate-800',
    btnBg: 'hover:border-slate-400 hover:bg-slate-50',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: WhatsAppIcon,
    domain: 'wa.me/',
    prefix: 'https://wa.me/',
    placeholder: '081234567890 atau 628...',
    badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    btnBg: 'hover:border-emerald-300 hover:bg-emerald-50/50',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: YouTubeIcon,
    domain: 'youtube.com/@',
    prefix: 'https://youtube.com/@',
    placeholder: 'nama_channel',
    badgeColor: 'bg-red-50 text-red-600 border-red-200',
    btnBg: 'hover:border-red-300 hover:bg-red-50/50',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: TwitterIcon,
    domain: 'x.com/',
    prefix: 'https://x.com/',
    placeholder: 'username (tanpa @)',
    badgeColor: 'bg-slate-900 text-white border-slate-800',
    btnBg: 'hover:border-slate-400 hover:bg-slate-50',
  },
  {
    id: 'shopee',
    name: 'Shopee',
    icon: ShoppingBagIcon,
    domain: 'shopee.co.id/',
    prefix: 'https://shopee.co.id/',
    placeholder: 'nama_toko',
    badgeColor: 'bg-amber-50 text-amber-600 border-amber-200',
    btnBg: 'hover:border-amber-300 hover:bg-amber-50/50',
  },
  {
    id: 'email',
    name: 'Email Bisnis',
    icon: MailIcon,
    domain: 'mailto:',
    prefix: 'mailto:',
    placeholder: 'kontak@bisnis.com',
    badgeColor: 'bg-blue-50 text-blue-600 border-blue-200',
    btnBg: 'hover:border-blue-300 hover:bg-blue-50/50',
  },
  {
    id: 'website',
    name: 'Website / Portofolio',
    icon: GlobeIcon,
    domain: 'https://',
    prefix: 'https://',
    placeholder: 'domain-anda.com',
    badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    btnBg: 'hover:border-indigo-300 hover:bg-indigo-50/50',
  },
];

/**
 * Intelligent URL normalizer for any social media platform
 */
function normalizeSocialUrl(platform, input) {
  if (!input) return '';
  let str = input.trim();

  // If already standard full valid URL with protocol
  if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('mailto:')) {
    return str;
  }

  // Handle WhatsApp numbers
  if (platform === 'whatsapp') {
    if (str.includes('wa.me/')) {
      return `https://${str.replace(/^https?:\/\//, '')}`;
    }
    let digits = str.replace(/[^0-9]/g, '');
    if (digits.startsWith('08')) {
      digits = '628' + digits.slice(2);
    }
    return digits ? `https://wa.me/${digits}` : '';
  }

  // Handle Email
  if (platform === 'email') {
    return `mailto:${str}`;
  }

  // Clean @ if provided
  const clean = str.replace(/^@/, '');

  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${clean}`;
    case 'tiktok':
      return `https://tiktok.com/@${clean}`;
    case 'twitter':
      return `https://x.com/${clean}`;
    case 'youtube':
      return clean.startsWith('@') ? `https://youtube.com/${clean}` : `https://youtube.com/@${clean}`;
    case 'shopee':
      return `https://shopee.co.id/${clean}`;
    case 'website':
      return `https://${clean}`;
    default:
      return `https://${clean}`;
  }
}

/**
 * Extract clean display value for input box (strip standard prefix for convenience)
 */
function getDisplayValue(platform, fullUrl) {
  if (!fullUrl) return '';
  const def = AVAILABLE_PLATFORMS.find((p) => p.id === platform);
  if (!def) return fullUrl;

  if (platform === 'whatsapp') {
    if (fullUrl.includes('wa.me/')) {
      return fullUrl.split('wa.me/')[1] || fullUrl;
    }
    return fullUrl;
  }

  if (platform === 'email') {
    return fullUrl.replace(/^mailto:/, '');
  }

  if (def.prefix && fullUrl.startsWith(def.prefix)) {
    return fullUrl.slice(def.prefix.length);
  }

  return fullUrl;
}

export default function SocialsBuilder({ settings, onChangeSettings }) {
  // Parse existing settings safely
  let items = [];
  try {
    items = typeof settings === 'string' ? JSON.parse(settings || '[]') : settings;
    if (!Array.isArray(items)) items = [];
  } catch {
    items = [];
  }

  // Update item URL or username
  const handleUpdateItem = (index, rawInput) => {
    const updated = [...items];
    const item = updated[index];
    const normalized = normalizeSocialUrl(item.platform, rawInput);
    updated[index] = { ...item, url: normalized };
    onChangeSettings(JSON.stringify(updated));
  };

  // Add platform to list
  const handleAddPlatform = (platformId) => {
    const newItem = {
      platform: platformId,
      url: '',
    };
    const updated = [...items, newItem];
    onChangeSettings(JSON.stringify(updated));
  };

  // Remove platform from list
  const handleRemoveItem = (index) => {
    const updated = items.filter((_, idx) => idx !== index);
    onChangeSettings(JSON.stringify(updated));
  };

  // Move platform up/down
  const handleMove = (index, direction) => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    onChangeSettings(JSON.stringify(updated));
  };

  const getPlatformDef = (platformId) => {
    return (
      AVAILABLE_PLATFORMS.find((p) => p.id === platformId) || {
        id: platformId,
        name: platformId,
        icon: LinkIcon,
        domain: 'https://',
        prefix: 'https://',
        placeholder: 'https://...',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Subheader */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-900 block">
            Pengaturan Akun Media Sosial
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Kelola tautan sosial media Anda. Klik platform di bawah untuk menambahkan langsung.
          </p>
        </div>
        {items.length > 0 && (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
            {items.length} Platform Aktif
          </span>
        )}
      </div>

      {/* Active Platforms List */}
      {items.length === 0 ? (
        <div className="p-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center space-y-2">
          <p className="text-xs font-semibold text-slate-700">Belum Ada Media Sosial Ditambahkan</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Tampilkan ikon Instagram, TikTok, WhatsApp, dan toko online Anda secara rapi di profil bio.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item, index) => {
            const def = getPlatformDef(item.platform);
            const Icon = def.icon;
            const displayVal = getDisplayValue(item.platform, item.url);

            return (
              <div
                key={`${item.platform}-${index}`}
                className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  {/* Brand Badge */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${def.badgeColor}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 capitalize block leading-tight">
                        {def.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {def.domain}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Reorder & Remove */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      title="Pindahkan ke atas"
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <MoveUpIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      title="Pindahkan ke bawah"
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <MoveDownIcon className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-3.5 bg-slate-200 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      title="Hapus platform ini"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Interactive Input with Domain Prefix */}
                <div className="flex rounded-lg border border-slate-200 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 overflow-hidden bg-slate-50/50">
                  <span className="inline-flex items-center px-2.5 py-1.5 text-[11px] font-mono text-slate-500 bg-slate-100/70 border-r border-slate-200 select-none">
                    {def.domain}
                  </span>
                  <input
                    type="text"
                    value={displayVal}
                    onChange={(e) => handleUpdateItem(index, e.target.value)}
                    placeholder={def.placeholder}
                    className="flex-1 px-2.5 py-1.5 text-xs text-slate-900 font-medium bg-transparent placeholder:text-slate-400 focus:outline-none"
                  />
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Uji coba tautan ini"
                      className="inline-flex items-center px-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                      <ExternalLinkIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Add Platform Buttons */}
      <div className="space-y-2 pt-1">
        <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
          Tambah Platform Media Sosial
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {AVAILABLE_PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const isAlreadyAdded = items.some((item) => item.platform === platform.id);

            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => handleAddPlatform(platform.id)}
                className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                  isAlreadyAdded
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-900 hover:bg-slate-900 hover:text-white shadow-2xs'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                    isAlreadyAdded ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="truncate flex-1">{platform.name}</span>
                {isAlreadyAdded ? (
                  <CheckIcon className="w-3 h-3 text-emerald-600 shrink-0 opacity-80" />
                ) : (
                  <PlusIcon className="w-3 h-3 opacity-50 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
