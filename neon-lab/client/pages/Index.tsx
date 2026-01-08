export default function Index() {
  return (
    <div className="min-h-screen bg-background px-5 py-5 md:px-8 lg:px-12">
      <div className="max-w-[440px] mx-auto lg:max-w-6xl">
        {/* Hero Section */}
        <div className="mb-8">
          {/* Welcome Header */}
          <div className="bg-white rounded-t-[20px] border border-blue-primary px-4 py-4">
            <h1 className="text-[24px] font-bold text-gray-text leading-normal">
              Good Morning, (Name)
            </h1>
            <p className="text-[16px] text-gray-text leading-normal mt-3">
              Fresh updates are waiting for you
            </p>
          </div>

          {/* Commission Card */}
          <div className="relative bg-gradient-to-br from-[#5B9CFF] to-[#1E6DFF] rounded-[20px] px-4 py-8 -mt-[54px] pt-[70px]">
            <div className="flex justify-end mb-2">
              <div className="flex items-center gap-[5px] text-white">
                <svg
                  width="11"
                  height="7"
                  viewBox="0 0 12 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="relative top-[2px]"
                >
                  <path
                    d="M11.5 0.5L7.48088 4.65625C7.4087 4.7309 7.3722 4.7683 7.3399 4.79774C6.81785 5.27352 6.02844 5.27353 5.50639 4.79775C5.47407 4.7683 5.4373 4.73093 5.36508 4.65624C5.29286 4.58156 5.25673 4.5442 5.22442 4.51475C4.70237 4.03897 3.91263 4.03897 3.39058 4.51475C3.35835 4.54413 3.32233 4.58137 3.25046 4.6557L0.5 7.5M11.5 0.5L11.4997 4.7M11.5 0.5H7.37481"
                    stroke="white"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[12px]">12%</span>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-[50px] font-bold text-white font-poppins leading-[75px]">
                1.350 €
              </h2>
              <p className="text-[16px] text-white leading-normal">
                Your Commission
              </p>
            </div>

            <div className="mt-6">
              <div className="w-full h-[10px] bg-white/30 rounded-[5px] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-white/50 via-yellow-200 to-orange-400 rounded-[5px]"
                  style={{ width: '62%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-[24px] font-bold text-gray-text leading-normal mb-6">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Add Client Card */}
            <div className="bg-white rounded-[20px] border border-gray-border px-4 py-4">
              <div className="w-[35px] h-[35px] rounded-full bg-[#DBE8FF] flex items-center justify-center mb-4">
                <svg
                  width="20"
                  height="16"
                  viewBox="0 0 22 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.6316 17C13.6316 14.6436 10.8039 12.7333 7.31579 12.7333C3.82768 12.7333 1 14.6436 1 17M17.8421 13.8V10.6M17.8421 10.6V7.4M17.8421 10.6H14.6842M17.8421 10.6H21M7.31579 9.53333C4.99038 9.53333 3.10526 7.62308 3.10526 5.26667C3.10526 2.91025 4.99038 1 7.31579 1C9.6412 1 11.5263 2.91025 11.5263 5.26667C11.5263 7.62308 9.6412 9.53333 7.31579 9.53333Z"
                    stroke="#1E6DFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-[16px] text-gray-text leading-normal mb-2">
                Add Client
              </h3>
              <p className="text-[12px] text-gray-light leading-normal">
                Buyer or renter
              </p>
            </div>

            {/* Add Property Card */}
            <div className="bg-white rounded-[20px] border border-gray-border px-4 py-4">
              <div className="w-[35px] h-[35px] rounded-full bg-[#DBE8FF] flex items-center justify-center mb-4">
                <svg
                  width="20"
                  height="17"
                  viewBox="0 0 22 19"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 18H3M3 18H13M3 18V4.2002C3 3.08009 3 2.51962 3.21799 2.0918C3.40973 1.71547 3.71547 1.40973 4.0918 1.21799C4.51962 1 5.08009 1 6.2002 1H9.8002C10.9203 1 11.4796 1 11.9074 1.21799C12.2837 1.40973 12.5905 1.71547 12.7822 2.0918C13 2.5192 13 3.07899 13 4.19691V10M13 18H19M13 18V10M19 18H21M19 18V10C19 9.06812 18.9999 8.60241 18.8477 8.23486C18.6447 7.74481 18.2557 7.35523 17.7656 7.15224C17.3981 7 16.9316 7 15.9997 7C15.0679 7 14.6019 7 14.2344 7.15224C13.7443 7.35523 13.3552 7.74481 13.1522 8.23486C13 8.60241 13 9.06812 13 10M6 8H10M6 5H10"
                    stroke="#1E6DFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-[16px] text-gray-text leading-normal mb-2">
                Add Property
              </h3>
              <p className="text-[12px] text-gray-light leading-normal">
                House or apartment
              </p>
            </div>
          </div>
        </div>

        {/* Recent Leads */}
        <div>
          <h2 className="text-[24px] font-bold text-gray-text font-poppins leading-normal mb-6">
            Recent Leads
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Lead Card 1 */}
            <LeadCard />

            {/* Lead Card 2 */}
            <LeadCard />

            {/* Lead Card 3 - Hidden on mobile */}
            <div className="hidden lg:block">
              <LeadCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadCard() {
  return (
    <div className="bg-white rounded-[20px] border border-gray-border px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-[35px] h-[35px] rounded-full bg-gray-border flex items-center justify-center flex-shrink-0">
          <svg
            width="14"
            height="18"
            viewBox="0 0 16 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 19C15 15.134 11.866 12 8 12C4.13401 12 1 15.134 1 19M8 9C5.79086 9 4 7.20914 4 5C4 2.79086 5.79086 1 8 1C10.2091 1 12 2.79086 12 5C12 7.20914 10.2091 9 8 9Z"
              stroke="#333333"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="text-[16px] text-gray-text leading-normal">
          Name Client
        </h3>
      </div>

      <div className="w-full h-[1px] bg-gray-border mb-4"></div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <div>
          <p className="text-[12px] text-gray-light leading-normal mb-1">
            Type
          </p>
          <p className="text-[12px] text-gray-text leading-normal">Buyer</p>
        </div>
        <div className="text-center">
          <p className="text-[12px] text-gray-light leading-normal mb-1">
            Looking for
          </p>
          <p className="text-[12px] text-gray-text leading-normal">House</p>
        </div>
        <div className="text-right">
          <p className="text-[12px] text-gray-light leading-normal mb-1">
            Budget
          </p>
          <p className="text-[12px] text-gray-text leading-normal">€180K</p>
        </div>
      </div>

      <button className="w-full bg-blue-primary hover:bg-blue-primary/90 transition-colors rounded-[4px] py-[6px] flex items-center justify-center gap-2">
        <svg
          width="12"
          height="11"
          viewBox="0 0 14 13"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.73307 11.3504L3.74905 10.5578L3.75652 10.5522C3.96833 10.387 4.07521 10.3036 4.19445 10.2442C4.30144 10.1909 4.41552 10.152 4.5332 10.1285C4.66585 10.1019 4.80402 10.1019 5.08138 10.1019H10.8687C11.614 10.1019 11.9871 10.1019 12.272 9.96036C12.5229 9.8357 12.727 9.63658 12.8548 9.39192C13 9.11404 13 8.75062 13 8.02383V3.07844C13 2.35163 13 1.98769 12.8548 1.70982C12.727 1.46516 12.5225 1.26638 12.2716 1.14172C11.9864 1 11.6135 1 10.8668 1H3.13346C2.38673 1 2.01308 1 1.72786 1.14172C1.47698 1.26638 1.27316 1.46516 1.14532 1.70982C1 1.98796 1 2.35235 1 3.08057V10.5383C1 11.2312 1 11.5775 1.14564 11.7555C1.2723 11.9102 1.46429 12.0002 1.66732 12C1.90077 11.9998 2.17829 11.7833 2.73307 11.3504Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[12px] font-bold text-white font-poppins">
          Message
        </span>
      </button>
    </div>
  );
}
