const bloodGroupStats = [
  { group: "A+", count: 12 },
  { group: "A-", count: 8 },
  { group: "B+", count: 15 },
  { group: "B-", count: 7 },
  { group: "O+", count: 20 },
  { group: "O-", count: 5 },
  { group: "AB+", count: 10 },
  { group: "AB-", count: 3 },
];

const gradients = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-violet-500 to-violet-600",
  "from-rose-500 to-rose-600",
  "from-cyan-500 to-cyan-600",
  "from-amber-500 to-amber-600",
  "from-indigo-500 to-indigo-600",
  "from-teal-500 to-teal-600",
];

const BloodBank = () => {
  return (
    <div className="container pt-2 mx-auto font-sans">
      <h2 className="text-2xl font-semibold">Blood Bank</h2>
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-5">
          {bloodGroupStats.map((stat, index) => (
            <div
              key={index}
              className={`card shadow-md hover:shadow-lg transform transition duration-300 bg-gradient-to-r ${
                gradients[index % gradients.length]
              } text-white p-4 rounded-lg`}
            >
              <div className="flex flex-col items-center justify-center">
                {/* Blood Group */}
                <h3 className="text-3xl font-bold mb-2">{stat.group}</h3>

                {/* Count with Hero Icon */}
                <p className="flex items-center text-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3.5v17m6-8.5H6"
                    />
                  </svg>
                  {stat.count} Available
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BloodBank;
