"use client";

import React from 'react';
import Image from 'next/image';
import mapCs1 from '../../assets/MapImages/map_cs1.png';
import mapCs2 from '../../assets/MapImages/map_cs2.png';
import { localizedRoomName } from '../../utils/room';
import { useI18n } from '../../providers/I18nProvider';

interface FloorMapProps {
  activeMap: 'Map1' | 'Map2';
  onRoomClick: (roomId: number) => void;
  selectedRoomId: number | null;
}

export default function FloorMap({ activeMap, onRoomClick, selectedRoomId }: FloorMapProps) {
  const { t } = useI18n();

  // Styles for interactive rooms
  const getInteractiveClass = (roomId: number) => {
    const isSelected = selectedRoomId === roomId;
    return `transition-all duration-200 cursor-pointer pointer-events-auto focus:outline-none ${
      isSelected
        ? 'opacity-100 fill-cyan-500/40 stroke-cyan-500 stroke-[3] filter drop-shadow'
        : 'opacity-0 hover:opacity-100 focus:opacity-100 fill-cyan-300/10 stroke-cyan-300/30 hover:fill-cyan-500/25 focus:fill-cyan-500/25 hover:stroke-cyan-500 focus:stroke-cyan-500 hover:stroke-[2] focus:stroke-[2]'
    }`;
  };

  const handleRoomKeyDown = (e: React.KeyboardEvent, roomId: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRoomClick(roomId);
    }
  };

  const interactiveRoomProps = (roomId: number) => ({
    tabIndex: 0,
    role: 'button',
    'aria-label': localizedRoomName(t, roomId, `Room ${roomId}`),
    onClick: () => onRoomClick(roomId),
    onKeyDown: (e: React.KeyboardEvent) => handleRoomKeyDown(e, roomId),
  });

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 shadow-lg">
      <div className="relative w-full h-auto aspect-[1177/757]">
        {activeMap === 'Map1' ? (
          <>
            {/* Background 2D Image */}
            <Image
              src={mapCs1}
              alt="Central Library Map 1"
              fill
              sizes="(max-w-7xl) 100vw, 1200px"
              priority
              className="object-contain"
            />

            {/* Interactive SVG Overlay */}
            <svg
              viewBox="0 0 1177 757"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0 w-full h-full pointer-events-none select-none z-10"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Interactive Spaces */}
              <rect id="locker" x="999" y="475" width="178" height="282" rx="4" className={getInteractiveClass(6)} {...interactiveRoomProps(6)} />
              <rect id="meetingRoom1" x="430" y="273" width="310" height="194" rx="4" className={getInteractiveClass(1)} {...interactiveRoomProps(1)} />
              <rect id="computerArea1" x="126" y="659" width="240" height="79" rx="4" className={getInteractiveClass(7)} {...interactiveRoomProps(7)} />
              <rect id="table1" x="70" y="383" width="69" height="107" rx="4" className={getInteractiveClass(11)} {...interactiveRoomProps(11)} />
              <rect id="computerArea2" x="36" y="576" width="57" height="126" rx="4" className={getInteractiveClass(8)} {...interactiveRoomProps(8)} />
              <rect id="table2" x="756" y="320" width="69" height="107" rx="4" className={getInteractiveClass(12)} {...interactiveRoomProps(12)} />
              <rect id="circlebookshelf" x="797" y="519" width="81" height="87" rx="40" className={getInteractiveClass(13)} {...interactiveRoomProps(13)} />
              <rect id="reception" x="735" y="646" width="164" height="44" rx="4" className={getInteractiveClass(14)} {...interactiveRoomProps(14)} />
              <rect id="lounge1" x="150" y="417" width="221" height="209" rx="4" className={getInteractiveClass(4)} {...interactiveRoomProps(4)} />
              <rect id="lounge2" x="934" y="232" width="158" height="185" rx="4" className={getInteractiveClass(5)} {...interactiveRoomProps(5)} />
              <rect id="studyZone2" x="284" y="81" width="98" height="276" rx="4" className={getInteractiveClass(10)} {...interactiveRoomProps(10)} />
              <rect id="meetingRoom2" x="425" y="626" width="295" height="123" rx="4" className={getInteractiveClass(2)} {...interactiveRoomProps(2)} />
              <rect id="meetingRoom3" x="962" y="0" width="215" height="182" rx="4" className={getInteractiveClass(3)} {...interactiveRoomProps(3)} />
              <rect id="studyZone1" x="460" y="68" width="440" height="100" rx="4" className={getInteractiveClass(9)} {...interactiveRoomProps(9)} />

              {/* Bookshelves (Non-Interactive, just visual layout elements) */}
              <g className="opacity-40">
                <rect id="bookshelf1" y="20" width="193" height="17" rx="2" fill="#B09B9C" />
                <rect id="bookshelf2" x="29" y="151" width="193" height="17" rx="2" fill="#B09B9C" />
                <rect id="bookshelf3" x="29" y="215" width="193" height="17" rx="2" fill="#B09B9C" />
                <rect id="bookshelf4" x="29" y="279" width="193" height="17" rx="2" fill="#B09B9C" />
                <rect id="bookshelf5" x="29" y="348" width="193" height="17" rx="2" fill="#B09B9C" />
                <rect id="bookshelf6" x="437" y="188" width="193" height="17" rx="2" fill="#B09B9C" />
                <rect id="bookshelf7" x="697" y="188" width="193" height="17" rx="2" fill="#B09B9C" />
                <rect id="bookshelf8" x="1013" y="427" width="144" height="17" rx="2" fill="#B09B9C" />
                <rect id="bookshelf9" x="1005" y="196" width="144" height="17" rx="2" fill="#B09B9C" />
                <rect id="bookshelf10" x="29" y="82" width="193" height="17" rx="2" fill="#B09B9C" />
                <rect id="bookshelf11" x="193" y="20" width="193" height="17" rx="2" fill="#B09B9C" />
                <rect id="bookshelf12" x="386" y="20" width="18" height="140" rx="2" fill="#B09B9C" />
                <rect id="bookshelf13" x="860" y="277" width="18" height="187" rx="2" fill="#B09B9C" />
                <rect id="bookshelf14" x="1139" y="219" width="18" height="202" rx="2" fill="#B09B9C" />
              </g>
            </svg>
          </>
        ) : (
          <>
            {/* Background 2D Image */}
            <Image
              src={mapCs2}
              alt="Linh Trung Library Map 2"
              fill
              sizes="(max-w-7xl) 100vw, 1200px"
              priority
              className="object-contain"
            />

            {/* Interactive SVG Overlay */}
            <svg
              viewBox="0 0 933 807"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0 w-full h-full pointer-events-none select-none z-10"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Interactive Spaces */}
              <rect id="meetingRoom3" x="542" y="593" width="386" height="204" rx="4" className={getInteractiveClass(17)} {...interactiveRoomProps(17)} />
              <rect id="lounge" x="407" y="269" width="276" height="256" rx="4" className={getInteractiveClass(18)} {...interactiveRoomProps(18)} />
              <rect id="meetingRoom1" x="0" y="0" width="287" height="216" rx="4" className={getInteractiveClass(15)} {...interactiveRoomProps(15)} />
              <rect id="meetingRoom2" x="0" y="400" width="244" height="407" rx="4" className={getInteractiveClass(16)} {...interactiveRoomProps(16)} />
              <rect id="locker" x="602" y="18" width="117" height="164" rx="4" className={getInteractiveClass(19)} {...interactiveRoomProps(19)} />
              <rect id="reception" x="805" y="60" width="54" height="136" rx="4" className={getInteractiveClass(23)} {...interactiveRoomProps(23)} />
              <rect id="studyZone1" x="707" y="296" width="127" height="209" rx="4" className={getInteractiveClass(20)} {...interactiveRoomProps(20)} />
              <rect id="studyZone2" x="38" y="269" width="210" height="91" rx="4" className={getInteractiveClass(21)} {...interactiveRoomProps(21)} />
              <rect id="computerCenter" x="305" y="287" width="87" height="91" rx="4" className={getInteractiveClass(22)} {...interactiveRoomProps(22)} />

              {/* Bookshelves (Non-Interactive, just visual layout elements) */}
              <g className="opacity-40">
                <rect id="bookshelf1" x="359" y="66" width="25" height="150" rx="2" fill="#D9D9D9" />
                <rect id="bookshelf2" x="430" y="66" width="25" height="150" rx="2" fill="#D9D9D9" />
                <rect id="bookshelf3" x="318" y="579" width="25" height="150" rx="2" fill="#D9D9D9" />
                <rect id="bookshelf4" x="392" y="579" width="25" height="150" rx="2" fill="#D9D9D9" />
                <rect id="bookshelf5" x="908" y="269" width="25" height="310" rx="2" fill="#D9D9D9" />
                <rect id="bookshelf6" x="248" y="487" width="25" height="310" rx="2" fill="#D9D9D9" />
                <rect id="bookshelf7" x="293" y="4" width="18" height="212" rx="2" fill="#D9D9D9" />
                <path id="bookshelf8" d="M312.5 22V4L604.5 4V22L312.5 22Z" fill="#D9D9D9" />
                <path id="bookshelf9" d="M604.5 583.5V565.5H896.5V583.5H604.5Z" fill="#D9D9D9" />
                <rect id="bookshelf10" x="506" y="66" width="25" height="150" rx="2" fill="#D9D9D9" />
              </g>
            </svg>
          </>
        )}
      </div>
    </div>
  );
}
