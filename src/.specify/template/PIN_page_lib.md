export default function PinVerificationDesign() {
  return (
    <div className="bg-[#F8EFE6] min-h-screen flex items-center justify-center p-6">
      <div className="flex max-w-[896px] flex-col items-start gap-8 w-[896px]">
        {/* Tiêu đề giao diện */}
        <div className="flex flex-col items-start gap-2 w-full">
          <div className="flex flex-col items-start w-full">
            <p className="text-[#000] font-inter text-[32px] font-bold leading-10 w-full tracking-[0.125em]">
              Verify User PIN
            </p>
          </div>
        </div>

        {/* Khung nhập mã PIN */}
        <div className="flex p-8 flex-col items-start rounded-xl border border-[#E8E2D5] bg-[#FFF] w-full relative shadow-[0_10px_30px_-5px_rgba(26,46,68,0.06)]">
          <div className="flex py-8 px-0 flex-col items-center w-full">
            
            {/* Nhãn hướng dẫn */}
            <div className="flex pb-8 flex-col items-start w-fit">
              <p className="text-[#43474D] font-hankenGrotesk text-xs font-bold leading-4 w-fit tracking-[0.2em]">
                ENTER VERIFICATION CODE
              </p>
            </div>

            {/* Các ô nhập PIN (6 ô) */}
            <div className="flex pb-12 flex-col items-start w-fit">
              <div className="flex items-start gap-4 w-fit">
                <div className="rounded-lg border border-[#E8E2D5] bg-[#FEF9EF] w-16 h-20 overflow-hidden"></div>
                <div className="rounded-lg border border-[#E8E2D5] bg-[#FEF9EF] w-16 h-20 overflow-hidden"></div>
                <div className="rounded-lg border border-[#E8E2D5] bg-[#FEF9EF] w-16 h-20 overflow-hidden"></div>
                <div className="w-2 h-full"></div> {/* Khoảng cách phân tách ở giữa */}
                <div className="rounded-lg border border-[#E8E2D5] bg-[#FEF9EF] w-16 h-20 overflow-hidden"></div>
                <div className="rounded-lg border border-[#E8E2D5] bg-[#FEF9EF] w-16 h-20 overflow-hidden"></div>
                <div className="rounded-lg border border-[#E8E2D5] bg-[#FEF9EF] w-16 h-20 overflow-hidden"></div>
              </div>
            </div>

            {/* Các nút bấm hành động */}
            <div className="flex justify-center items-start gap-4 w-full">
              {/* Nút Verify */}
              <div className="cursor-pointer flex py-3 px-12 items-center gap-2 rounded-full bg-[#000] w-fit">
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex flex-col items-center w-fit">
                  <path d="M4.05417 7.90417L7.35 4.60833L6.51875 3.77708L4.05417 6.24167L2.82917 5.01667L1.99792 5.84792L4.05417 7.90417ZM4.66667 11.6667C3.31528 11.3264 2.19965 10.551 1.31979 9.34062C0.439931 8.13021 0 6.78611 0 5.30833V1.75L4.66667 0L9.33333 1.75V5.30833C9.33333 6.78611 8.8934 8.13021 8.01354 9.34062C7.13368 10.551 6.01806 11.3264 4.66667 11.6667ZM4.66667 10.4417C5.67778 10.1208 6.51389 9.47917 7.175 8.51667C7.83611 7.55417 8.16667 6.48472 8.16667 5.30833V2.55208L4.66667 1.23958L1.16667 2.55208V5.30833C1.16667 6.48472 1.49722 7.55417 2.15833 8.51667C2.81944 9.47917 3.65556 10.1208 4.66667 10.4417Z" fill="white"/>
                </svg>
                <p className="text-[#FFF] font-hankenGrotesk text-xs font-bold leading-4 w-fit tracking-[0.1em]">VERIFY PIN</p>
              </div>
              
              {/* Nút Clear */}
              <button className="cursor-pointer text-nowrap flex py-3.5 px-8 flex-col justify-center items-center rounded-full w-fit">
                <p className="text-[#43474D] font-hankenGrotesk text-xs font-bold leading-4 w-fit tracking-[0.1em]">CLEAR</p>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}