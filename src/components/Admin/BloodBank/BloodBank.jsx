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
  "from-blue-900 via-purple-800 to-pink-700", 
  "from-indigo-900 via-blue-700 to-teal-600",
  "from-purple-900 via-violet-800 to-blue-600",
  "from-teal-800 via-green-700 to-emerald-600",
  "from-blue-800 via-indigo-700 to-fuchsia-700",
  "from-gray-900 via-blue-800 to-purple-700",
  "from-cyan-900 via-teal-800 to-blue-700",
  "from-fuchsia-900 via-purple-800 to-indigo-700",
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
