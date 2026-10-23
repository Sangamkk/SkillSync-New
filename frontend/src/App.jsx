import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/student/applicantRegister";


import AdminDashboard from "./pages/AdminDashboard";


// Applicant Pages
import StudentDashboard from "./pages/student/Dashboard";
import StudentProfile from "./pages/student/StudentProfile";
import Certificate from "./pages/student/Certificate";
import Jobs from "./pages/student/Jobs";
import JobDetail from "./pages/student/JobDetail";
import StudentOffers from "./pages/student/StudentOffers";
import AddProject from "./pages/student/AddProject";
import RequestVerification from "./pages/student/RequestVerification";
import MyProjects from "./pages/student/project/MyProjects";
import ProjectHistory from "./pages/student/project/ProjectHistory";

// Organisation Pages
import OrganisationDashboard from "./pages/Organisation/organizationDashboard";
import CreateJob from "./pages/Organisation/CreateJob";
import MyJobs from "./pages/Organisation/MyJobs";
import OrganisationJobDetail from "./pages/Organisation/OrganisationJobDetail";
import Applicants from "./pages/Organisation/Applicants";
import ApplicantDetail from "./pages/Organisation/ApplicantDetail";
import CandidateProfilePage from "./pages/Organisation/CandidateProfilePage";
import  Employees from "./pages/Organisation/Employee";
import PendingProjects from "./pages/Organisation/PendingProjects";
import ExtractCertificate from "./pages/Organisation/ExtractCertificate";
import RegisterOrganisation from "./pages/Organisation/RegisterOrganisation";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        

        {/* Applicant Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/certificate" element={<Certificate />} />
        <Route path="/student/jobs" element={<Jobs />} />
        <Route path="/student/jobs/:jobId" element={<JobDetail />} />
        <Route path="/student/offers" element={<StudentOffers />} />
        <Route path="/student/project" element={<AddProject />} />
        <Route path="/student/project/add" element={<AddProject />} />
        <Route path="/student/project/verify" element={<RequestVerification />} />
        <Route path="/student/projects" element={<MyProjects />} />
        <Route path="/student/project-history" element={<ProjectHistory />}/>

        {/* Organisation Routes */}
        <Route path="/org/register" element={<RegisterOrganisation />} />
        <Route path="/organisation" element={<OrganisationDashboard />}/>
        <Route path="/organisation/create-job" element={<CreateJob />} />
        <Route path="/organisation/jobs/new" element={<CreateJob />} />
        <Route path="/organisation/jobs" element={<MyJobs />} />
        <Route path="/organisation/jobs/:jobId/applications" element={<Applicants />} />
        <Route path="/organisation/jobs/:jobId/applications/:applicationId" element={<ApplicantDetail />} />
        <Route path="/organisation/jobs/:jobId/applications/:applicationId/profile" element={<CandidateProfilePage />} />
        <Route path="/organisation/employees"  element={<Employees />}/>
        <Route path="/organisation/project"  element={<PendingProjects />}/>
        <Route path="/organisation/extract-certificate/:certificateId" element={<ExtractCertificate />} />
        
        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />

 
        

<<<<<<< Updated upstream
        
=======
        {/* ─── Student Routes ────────────────────────────────────────── */}
        <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/student/dashboard" element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student/profile" element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentProfile />
          </ProtectedRoute>
        } />
        <Route path="/student/certificates" element={
          <ProtectedRoute requiredRole="STUDENT">
            <Certificate />
          </ProtectedRoute>
        } />
        {/* legacy /certificate alias */}
        <Route path="/certificate" element={<Navigate to="/student/certificates" replace />} />
        <Route path="/student/jobs" element={
          <ProtectedRoute requiredRole="STUDENT">
            <Jobs />
          </ProtectedRoute>
        } />
        <Route path="/student/jobs/:jobId" element={
          <ProtectedRoute requiredRole="STUDENT">
            <JobDetail />
          </ProtectedRoute>
        } />
        <Route path="/student/offers" element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentOffers />
          </ProtectedRoute>
        } />
        <Route path="/student/project" element={
          <ProtectedRoute requiredRole="STUDENT">
            <AddProject />
          </ProtectedRoute>
        } />
        <Route path="/student/project/add" element={
          <ProtectedRoute requiredRole="STUDENT">
            <AddProject />
          </ProtectedRoute>
        } />
        <Route path="/student/project/verify" element={
          <ProtectedRoute requiredRole="STUDENT">
            <RequestVerification />
          </ProtectedRoute>
        } />
        <Route path="/student/projects" element={
          <ProtectedRoute requiredRole="STUDENT">
            <MyProjects />
          </ProtectedRoute>
        } />
        <Route path="/student/project-history" element={
          <ProtectedRoute requiredRole="STUDENT">
            <ProjectHistory />
          </ProtectedRoute>
        } />
        <Route path="/student/projects/history" element={<Navigate to="/student/project-history" replace />} />
        <Route path="/student/project/history" element={<Navigate to="/student/project-history" replace />} />

        {/* ─── Organisation Routes ───────────────────────────────────── */}
        <Route path="/organisation" element={
          <ProtectedRoute requiredRole="ORGANISATION">
            <OrganisationDashboard />
          </ProtectedRoute>
        } />
        <Route path="/organisation/create-job" element={
          <ProtectedRoute requiredRole="ORGANISATION">
            <CreateJob />
          </ProtectedRoute>
        } />
        <Route path="/organisation/jobs/new" element={
          <ProtectedRoute requiredRole="ORGANISATION">
            <CreateJob />
          </ProtectedRoute>
        } />
        <Route path="/organisation/jobs" element={
          <ProtectedRoute requiredRole="ORGANISATION">
            <MyJobs />
          </ProtectedRoute>
        } />
        <Route path="/organisation/jobs/:jobId" element={
          <ProtectedRoute requiredRole="ORGANISATION">
            <OrganisationJobDetail />
          </ProtectedRoute>
        } />
        <Route path="/organisation/jobs/:jobId/applications" element={
          <ProtectedRoute requiredRole="ORGANISATION">
            <Applicants />
          </ProtectedRoute>
        } />
        <Route path="/organisation/jobs/:jobId/applications/:applicationId" element={
          <ProtectedRoute requiredRole="ORGANISATION">
            <ApplicantDetail />
          </ProtectedRoute>
        } />
        {/* Merged redundant route: Candidate Profile is now part of ApplicantDetail resume view */}
        <Route path="/organisation/jobs/:jobId/applications/:applicationId/profile" element={
          <ProtectedRoute requiredRole="ORGANISATION">
            <ApplicantDetail />
          </ProtectedRoute>
        } />
        <Route path="/organisation/employees" element={
          <ProtectedRoute requiredRole="ORGANISATION">
            <Employees />
          </ProtectedRoute>
        } />
        <Route path="/organisation/project" element={
          <ProtectedRoute requiredRole="ORGANISATION">
            <PendingProjects />
          </ProtectedRoute>
        } />
        <Route path="/organisation/projects" element={
          <ProtectedRoute requiredRole="ORGANISATION">
            <PendingProjects />
          </ProtectedRoute>
        } />
        <Route path="/organisation/pending-projects" element={
          <ProtectedRoute requiredRole="ORGANISATION">
            <PendingProjects />
          </ProtectedRoute>
        } />
        <Route path="/organisation/pending-verifications" element={
          <ProtectedRoute requiredRole="ORGANISATION">
            <PendingVerifications />
          </ProtectedRoute>
        } />
        <Route path="/organisation/issue-certificate" element={
          <ProtectedRoute requiredRole="ORGANISATION">
            <IssueCertificate />
          </ProtectedRoute>
        } />
        <Route path="/organisation/extract-certificate/:certificateId" element={
          <ProtectedRoute requiredRole="ORGANISATION">
            <ExtractCertificate />
          </ProtectedRoute>
        } />

        {/* ─── Admin Routes ──────────────────────────────────────────── */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* ─── Catch-all ─────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
>>>>>>> Stashed changes
      </Routes>
    </BrowserRouter>
  );
}

export default App;