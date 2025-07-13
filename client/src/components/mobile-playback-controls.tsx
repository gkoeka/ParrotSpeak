import React from 'react';

/**
 * A completely static component for the mobile preview
 * Always shows play and stop controls, with no state management
 */
export default function MobilePlaybackControls() {
  return (
    <div className="flex items-center mt-2">
      <button 
        className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2"
        onClick={() => console.log('Play clicked in mobile preview')}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-gray-600 dark:text-gray-300"
        >
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </button>
      <button 
        className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
        onClick={() => console.log('Stop clicked in mobile preview')}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-gray-600 dark:text-gray-300"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        </svg>
      </button>
    </div>
  );
}