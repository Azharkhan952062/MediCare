import React, { useMemo, useState, useEffect } from "react";
import { dashboardStyles } from "../assets/dummyStyles";
import { Badge, BadgeIndianRupee, Calendar, CalendarRange, Check, CheckCircle, Search, User, UserRoundCheck, Users, XCircle } from "lucide-react";

const API_BASE = 'http://localhost:4000';
const PATIENT_COUNT_API = `${API_BASE}/api/appointments/patients/count`;

// HELPER FUNCTION;
const safeNumber = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
};

function normalizeDoctor(doc) {
    const id = doc._id || doc.id || String(Math.random()).slice(2);
    const name =
        doc.name ||
        doc.fullName ||
        `${doc.firstName || ""} ${doc.lastName || ""}`.trim() ||
        "Unknown";
    const specialization =
        doc.specialization ||
        doc.specialty ||
        (Array.isArray(doc.specializations)
            ? doc.specializations.join(", ")
            : "") ||
        "General";
    const fee = safeNumber(
        doc.fee ?? doc.fees ?? doc.consultationFee ?? doc.consultation_fee ?? 0
    );
    const image =
        doc.imageUrl ||
        doc.image ||
        doc.avatar ||
        `https://i.pravatar.cc/150?u=${id}`;

    const appointments = {
        total:
            doc.appointments?.total ??
            doc.totalAppointments ??
            doc.appointmentsTotal ??
            0,
        completed:
            doc.appointments?.completed ??
            doc.completedAppointments ??
            doc.appointmentsCompleted ??
            0,
        canceled:
            doc.appointments?.canceled ??
            doc.canceledAppointments ??
            doc.appointmentsCanceled ??
            0,
    };

    let earnings = null;
    if (doc.earnings !== undefined && doc.earnings !== null)
        earnings = safeNumber(doc.earnings, 0);
    else if (doc.revenue !== undefined && doc.revenue !== null)
        earnings = safeNumber(doc.revenue, 0);
    else if (appointments.completed && fee)
        earnings = fee * safeNumber(appointments.completed, 0);
    else earnings = 0;

    return {
        id,
        name,
        specialization,
        fee,
        image,
        appointments,
        earnings,
        raw: doc,
    };
}


const DashboardPage = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // new patient count
    const [patientCount, setPatientCount] = useState(null);
    const [patientCountLoading, setPatientCountLoading] = useState(false);

    const [query, setQuery] = useState("");
    const [showAll, setShowAll] = useState(false);
    //const [counts,setCounts]=useState({});

    // to load doctors from the server

    useEffect(() => {
        let mounted = true;
        async function loadDoctors() {
            setLoading(true);
            setError(null);
            try {
                const url = `${API_BASE}/api/doctors?limit=200`;
                const res = await fetch(url);
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body?.message || `Failed to fetch doctors (${res.status})`);
                }
                const body = await res.json();

                let list = [];

                if (Array.isArray(body?.doctors)) {
                    list = body.doctors;
                }
                else if (Array.isArray(body?.data)) {
                    list = body.data;
                }
                else if (Array.isArray(body)) {
                    list = body;
                }
                else {
                    list = [];
                }
                const normalized = list.map(d => normalizeDoctor(d));
                if (mounted) setDoctors(normalized);
            } catch (err) {
                console.error("Failed to load doctors:", err);
                if (mounted) {
                    setError(err.message || "Failed to load doctors");
                    setDoctors([]);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        }
        loadDoctors();
        return () => {
            mounted = false;
        };
    }, []);

    const totals = useMemo(() => {
        const totalDoctors = doctors.length;
        const totalAppointments = doctors.reduce((s, d) => s + safeNumber(d.appointments?.total, 0), 0);
        const totalEarnings = doctors.reduce((s, d) => s + safeNumber(d.earnings, 0), 0);
        const completed = doctors.reduce((s, d) => s + safeNumber(d.appointments?.completed, 0), 0);
        const canceled = doctors.reduce((s, d) => s + safeNumber(d.appointments?.canceled, 0), 0);
        const totalLoginPatients =
            doctors.reduce((s, d) => s + (d.raw?.loginPatientsCount ?? 0), 0) || 0;
        return {
            totalDoctors,
            totalAppointments,
            totalEarnings,
            completed,
            canceled,
            totalLoginPatients,
        };
    }, [doctors]);
    const filteredDoctors = useMemo(() => {
        if (!query) return doctors;
        const q = query.trim().toLowerCase();
        const qNum = Number(q);
        return doctors.filter((d) => {
            if (d.name.toLowerCase().includes(q)) return true;
            if ((d.specialization || "").toLowerCase().includes(q)) return true;
            if (d.fee.toString().includes(q)) return true;
            if (!Number.isNaN(qNum) && d.fee <= qNum) return true;
            return false;
        });
    }, [doctors, query]);

    const INITIAL_COUNT = 8;

    const visibleDoctors = showAll
        ? filteredDoctors
        : filteredDoctors.slice(0, INITIAL_COUNT);
    useEffect(() => {
        let mounted = true;
        async function loadPatientCount() {
            setPatientCountLoading(true);
            try {
                const res = await fetch(PATIENT_COUNT_API);
                if (!res.ok) {
                    console.warn("Patient count fetch failed:", res.status);
                    if (mounted) setPatientCount(0);
                    return;
                }
                const body = await res.json().catch(() => ({}));
                const count = Number(
                    body?.count ?? body?.totalUsers ?? body?.data ?? 0
                );
                if (mounted) setPatientCount(isNaN(count) ? 0 : count);
            } catch (err) {
                console.error("Failed to fetch patient count:", err);
                if (mounted) setPatientCount(0);
            } finally {
                if (mounted) setPatientCountLoading(false);
            }
        }
        loadPatientCount();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className={dashboardStyles.pageContainer}>
            <div className={dashboardStyles.maxWidthContainer}>
                <div className={dashboardStyles.headerContainer}>
                    <div>
                        <h1 className={dashboardStyles.headerTitle}>DASHBOARD</h1>
                        <p className={dashboardStyles.headerSubtitle}>
                            Overview of doctors & appointments
                        </p>
                    </div>
                </div>

                {/* stats section */}
                <div className={dashboardStyles.statsGrid}>
                    <StatCard icon={<Users className="w-6 h-6" />}
                        label="Total Doctors" value={totals.totalDoctors}
                    />
                    <StatCard icon={<UserRoundCheck className="w-6 h-6" />}
                        label="Total Registered" value={patientCountLoading ? "Loading..." : (patientCount ?? totals.totalLoginPatients)}
                    />

                    <StatCard icon={<CalendarRange className="w-6 h-6" />}
                        label="Total Appointments" value={totals.totalAppointments}
                    />

                    <StatCard icon={<BadgeIndianRupee className="w-6 h-6" />}
                        label="Total Earnings" value={`₹ ${totals.totalEarnings.toLocaleString()}`}
                    />

                    <StatCard icon={<CheckCircle className="w-6 h-6" />}
                        label="Completed" value={totals.completed}
                    />

                    <StatCard icon={<XCircle className="w-6 h-6" />}
                        label="Canceled" value={totals.canceled}
                    />
                </div>
                <div className="mb-6">
                    <label className={dashboardStyles.searchLabel}>Search Doctors</label>
                    <div className={dashboardStyles.searchContainer}>
                        <div className={dashboardStyles.searchInputContainer}>
                            <input value={query} onChange={(e) => setQuery(e.target.value)}
                                className={dashboardStyles.searchInput}
                                placeholder="Search name / Specialization / fee"
                            />
                            <Search className={dashboardStyles.searchIcon} />
                        </div>
                        <button
                            onClick={() => {
                                setQuery("");
                                setShowAll(false);
                            }}
                            className={dashboardStyles.clearButton + " " + dashboardStyles.cursorPointer}
                        >
                            Clear
                        </button>
                    </div>
                </div>
                <div className={dashboardStyles.tableContainer}>
                    <div className={dashboardStyles.tableHeader} >
                        <h2 className={dashboardStyles.tableTitle}>Doctors</h2>
                        <p className={dashboardStyles.tableCount}>
                            {loading
                                ? "Loading.."
                                : `Showing ${visibleDoctors.length} of ${filteredDoctors.length}`}
                        </p>
                    </div>

                    {error && (
                        <div className={dashboardStyles.errorContainer}>
                            Error loading doctors: {error}
                        </div>
                    )}

                    <div className={dashboardStyles.tableWrapper}>
                        <table className={dashboardStyles.table}>
                            <thead className={dashboardStyles.tableHead}>
                                <tr>
                                    <th className={dashboardStyles.tableHeaderCell}>Doctor</th>
                                    <th className={dashboardStyles.tableHeaderCell}>Specialization</th>
                                    <th className={dashboardStyles.tableHeaderCell}>Fee</th>
                                    <th className={dashboardStyles.tableHeaderCell}>Appointments</th>
                                    <th className={dashboardStyles.tableHeaderCell}>Completed</th>
                                    <th className={dashboardStyles.tableHeaderCell}>Canceled</th>
                                    <th className={dashboardStyles.tableHeaderCell}>Total Earnings</th>
                                </tr>
                            </thead>

                            <tbody className={dashboardStyles.tableBody}>
                                {visibleDoctors.map((d, idx) => (
                                    <tr
                                        key={d.id}
                                        className={dashboardStyles.tableRow + " " +
                                            (idx % 2 === 0 ? dashboardStyles.tableRowEven : dashboardStyles.tableRowOdd)}
                                    >
                                        <td className={dashboardStyles.tableCell + " " + dashboardStyles.tableCellFlex}>
                                            <div className={dashboardStyles.verticalLine} />
                                            <img
                                                src={d.image}
                                                alt={d.name}
                                                className={dashboardStyles.doctorImage}
                                            />
                                            <div>
                                                <div className={dashboardStyles.doctorName}>
                                                    {d.name}
                                                </div>
                                                <div className={dashboardStyles.doctorId}>
                                                    ID: {d.id}
                                                </div>
                                            </div>
                                        </td>

                                        <td className={dashboardStyles.tableCell + " " + dashboardStyles.doctorSpecialization}>
                                            {d.specialization}
                                        </td>

                                        <td className={dashboardStyles.tableCell + " " + dashboardStyles.feeText}>
                                            ₹ {d.fee}
                                        </td>

                                        <td className={dashboardStyles.tableCell + " " + dashboardStyles.appointmentsText}>
                                            {d.appointments.total}
                                        </td>

                                        <td className={dashboardStyles.tableCell + " " + dashboardStyles.completedText}>
                                            {d.appointments.completed}
                                        </td>

                                        <td className={dashboardStyles.tableCell + " " + dashboardStyles.canceledText}>
                                            {d.appointments.canceled}
                                        </td>

                                        <td className={dashboardStyles.tableCell + " " + dashboardStyles.earningsText}>
                                            ₹ {d.earnings.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className={dashboardStyles.mobileDoctorContainer}>
                        <div className={dashboardStyles.mobileDoctorGrid}>
                            {visibleDoctors.map((d) => (
                                <MobileDoctorCard key={d.id} d={d} />
                            ))}
                        </div>
                    </div>

                    {filteredDoctors.length > INITIAL_COUNT && (
                        <div className={dashboardStyles.showMoreButton}>
                            <button onClick={() => setShowAll((e) => !s)}>
                                {showAll ?
                                    "Show less" : `Show more (${filteredDoctors.length - INITIAL_COUNT})`
                                }
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DashboardPage;

function StatCard({ icon, label, value }) {
    return (
        <div className={dashboardStyles.statCard}>
            <div className={dashboardStyles.statCardContent}>
                <div className={dashboardStyles.statIconContainer}>{icon}</div>
                <div className={dashboardStyles.statLabel}>{label}</div>
                <div className={dashboardStyles.statValue}>{value}</div>
            </div>
        </div>
    );
}

function MobileDoctorCard({ d }) {
    return (
        <div className={dashboardStyles.mobileDoctorCard}>
            <div className={dashboardStyles.mobileDoctorHeader}>
                <div className=" flex items-center gap-3">
                    <img src={d.image} alt={d.name} className={dashboardStyles.mobileDoctorImage} />
                    <div>
                        <div className={dashboardStyles.mobileDoctorName}>{d.name}</div>
                        <div className={dashboardStyles.mobileDoctorSpecialization}>
                            {d.specialization}
                        </div>
                    </div>
                </div>
                <div className={dashboardStyles.mobileDoctorFee}>₹ {d.fee}</div>
            </div>
            <div className={dashboardStyles.mobileStatsGrid}>
                <div>
                    <div className={dashboardStyles.mobileStatLabel}>Appts</div>
                    <div className={dashboardStyles.mobileStatValue}>{d.appointments.total}</div>
                </div>

                <div>
                    <div className={dashboardStyles.mobileStatLabel}>Done</div>
                    <div className={dashboardStyles.mobileStatValue + " " + dashboardStyles.textEmerald600}>
                        {d.appointments.completed}
                    </div>
                </div>

                <div>
                    <div className={dashboardStyles.mobileStatLabel}>Cancel</div>
                    <div className={dashboardStyles.mobileStatValue + " " + dashboardStyles.textRose500}>
                        {d.appointments.canceled}
                    </div>
                </div>
            </div>

            <div className={dashboardStyles.mobileEarningsContainer}>
                <div>Earned</div>
                <div className="fornt-semibold">₹ {d.earnings.toLocaleString()}</div>

            </div>
        </div>
    )
}