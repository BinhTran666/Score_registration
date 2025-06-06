import React from 'react';
import UserRegistration from './UserRegistration';
import DetailedScores from './DetailedScores';

function MainContent() {
  return (
    <main className="flex-1 p-8 bg-gray-100 overflow-y-auto">
      <UserRegistration />
      <DetailedScores />
    </main>
  );
}

export default MainContent;