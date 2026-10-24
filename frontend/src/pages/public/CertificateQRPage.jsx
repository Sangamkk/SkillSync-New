import { useParams, Navigate } from "react-router-dom";

/**
 * CertificateQRPage
 * Redirects seamlessly to the unified verification page with the QR view active.
 */
const CertificateQRPage = () => {
  const { certificateId } = useParams();

  if (!certificateId) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/verify/${certificateId}?tab=qr`} replace />;
};

export default CertificateQRPage;
