import { useState, useEffect } from 'react'
import type { FC } from 'react'

declare const __APP_VERSION__: string;

const Updater: FC = () => {
  const [hasUpdate, setHasUpdate] = useState(false)
  const [latestVersion, setLatestVersion] = useState('')
  const [releaseUrl, setReleaseUrl] = useState('')

  useEffect(() => {
    fetch('https://api.github.com/repos/pkochubey/my-simple-tools/releases/latest')
      .then(res => res.json())
      .then(data => {
        if (data && data.tag_name) {
          let currentVersion = '1.0.0';
          try {
             currentVersion = __APP_VERSION__;
          } catch(e) {}
          
          const remoteVersion = data.tag_name.replace(/^v/, '');
          
          if (remoteVersion !== currentVersion) {
            if (remoteVersion.localeCompare(currentVersion, undefined, { numeric: true, sensitivity: 'base' }) > 0) {
              setHasUpdate(true)
              setLatestVersion(remoteVersion)
              setReleaseUrl(data.html_url)
            }
          }
        }
      })
      .catch(err => {
        console.error('Failed to check for updates:', err)
      })
  }, [])

  if (!hasUpdate) return null;

  return (
    <div className="updater-banner">
      <span>🚀 A new version ({latestVersion}) is available!</span>
      <a href={releaseUrl} target="_blank" rel="noreferrer" className="updater-btn">Download Update</a>
      
      <style>{`
        .updater-banner {
          background: linear-gradient(90deg, #1a1a2e 0%, #16213e 100%);
          border-bottom: 1px solid #0f3460;
          color: white;
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          animation: slideDown 0.5s ease-out;
        }
        .updater-banner span {
          font-weight: 600;
          font-family: 'Inter', sans-serif;
        }
        .updater-btn {
          text-decoration: none;
          background-color: #e94560;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 600;
          transition: background-color 0.2s;
        }
        .updater-btn:hover {
          background-color: #d13d54;
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default Updater
