/**
 * AHSPage.jsx — AHS Portal
 *
 * Shows all images for a session in their anonymized (encrypted noise) state.
 * AHS users enter a password to decrypt and view the original images.
 *
 * Flow:
 *   1. Page loads → fetches visual_output.json to get all image_ids
 *   2. For each image_id → fetches raw encrypted bytes → renders as canvas noise
 *   3. AHS user enters password → each image fetches decrypted version from server
 *      The password is sent as AHS-Password header — never stored anywhere
 *
 * Route: /ahs/:sessionId?device_id=jetson01
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchImages, fetchImageEncrypted, fetchAHSImage } from "../api/client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Render Fernet-encrypted bytes as pixel noise on a canvas
// Returns a data URL string
function encryptedBytesToNoiseUrl(arrayBuffer) {
  const raw = new Uint8Array(arrayBuffer);
  const side = Math.floor(Math.sqrt(raw.length / 3));
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  const imgData = ctx.createImageData(side, side);
  for (let i = 0; i < side * side; i++) {
    imgData.data[i * 4 + 0] = raw[i * 3 + 0] ?? 0;
    imgData.data[i * 4 + 1] = raw[i * 3 + 1] ?? 0;
    imgData.data[i * 4 + 2] = raw[i * 3 + 2] ?? 0;
    imgData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL();
}

/**
 * A single image card.
 * Shows noise by default, decrypted image after AHS password is confirmed.
 */
function ImageCard({ imageId, sessionId, deviceId, ahsPassword }) {
  const [noiseSrc, setNoiseSrc] = useState(null);
  const [decryptedSrc, setDecryptedSrc] = useState(null);
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState("");

  // Load noise version on mount
  useEffect(() => {
    fetchImageEncrypted(sessionId, imageId, deviceId)
      .then((buffer) => setNoiseSrc(encryptedBytesToNoiseUrl(buffer)))
      .catch(() => setError("Failed to load image"));
  }, [imageId, sessionId, deviceId]);

  // Decrypt when ahsPassword is provided
  useEffect(() => {
    if (!ahsPassword) {
      setDecryptedSrc(null);
      return;
    }
    setDecrypting(true);
    setError("");
    fetchAHSImage(sessionId, imageId, deviceId, ahsPassword)
      .then((src) => setDecryptedSrc(src))
      .catch(() => setError("Decryption failed — check password"))
      .finally(() => setDecrypting(false));
  }, [ahsPassword, sessionId, imageId, deviceId]);

  const src = decryptedSrc || noiseSrc;

  return (
    <div className="bg-white/75 border border-muted/20 rounded-lg overflow-hidden">
      <div className="aspect-square bg-app-bg/60 flex items-center justify-center">
        {src
          ? <img src={src} alt={imageId} className="w-full h-full object-contain" />
          : <p className="text-muted text-sm">Loading...</p>
        }
      </div>
      <div className="p-2">
        <p className="text-muted text-lg truncate">{imageId}</p>
        {decrypting && <p className="text-brand-gold text-sm mt-1">Decrypting...</p>}
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        {decryptedSrc && !error && (
          <p className="text-green-400 text-sm mt-1">Decrypted</p>
        )}
      </div>
    </div>
  );
}

export default function AHSPage() {
  const { sessionId } = useParams();
  // device_id is embedded in session_id: session_{date}_{time}_{device_id}
  const deviceId = sessionId.split("_").slice(3).join("_");

  const [imageIds, setImageIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [ahsPassword, setAhsPassword] = useState(""); // only set on submit

  // Load visual_output.json to get all image_ids for this session
  useEffect(() => {
    fetchImages(sessionId, deviceId)
      .then((data) => setImageIds(data.images))
      .catch((err) => setError(err.message ?? "Failed to load session data"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  function handleDecrypt(e) {
    e.preventDefault();
    setAhsPassword(password);  // triggers useEffect in each ImageCard
  }

  function handleLock() {
    setAhsPassword("");
    setPassword("");
  }

  return (
    <div className="min-h-screen bg-app-bg text-ink flex flex-col">
      <Navbar />

      <main className="flex-1 h-full max-w-full px-8 py-10 pb-24">
        <div className="flex items-center gap-4 mb-8 min-w-0">
          <Link
            to="/ahs"
            className="text-muted text-sm hover:text-ink transition-colors whitespace-nowrap"
          >
            ← Sessions
          </Link>
          <h1 className="text-brand-gold text-lg font-semibold whitespace-nowrap">AHS Portal</h1>
          <span className="text-muted/80 text-sm truncate">{sessionId}</span>
        </div>

        {/* Password gate */}
        <div className="mb-8 min-w-0 max-w-5xl bg-white/75 border border-muted/20 rounded-lg px-4 py-4 shadow-sm sm:px-6 sm:py-5">
          <p className="text-muted text-sm mb-4 break-words">
            Images are shown anonymized by default. Enter the AHS password to decrypt.
          </p>

          {ahsPassword ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-green-400 text-sm">Images decrypted</p>
              <button
                onClick={handleLock}
                className="text-muted text-sm hover:text-ink transition-colors shrink-0"
              >
                Lock
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleDecrypt}
              className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center"
            >
              <input
                type="password"
                placeholder="AHS password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="min-w-0 w-full flex-1 bg-white text-ink placeholder-muted/80 border border-muted/25
                           rounded px-4 py-2 text-sm focus:outline-none focus:border-brand-gold sm:min-w-[12rem]"
              />
              <button
                type="submit"
                className="w-full shrink-0 bg-brand-gold text-ink font-semibold rounded px-4 py-2
                           text-sm hover:opacity-90 transition-opacity sm:w-auto"
              >
                Decrypt all
              </button>
            </form>
          )}
        </div>

        {/* Image grid */}
        {loading && <p className="text-muted text-sm">Loading...</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {!loading && !error && imageIds.length === 0 && (
          <p className="text-muted text-sm">No images found for this session.</p>
        )}

        {!loading && !error && imageIds.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imageIds.map((id) => (
              <ImageCard
                key={id}
                imageId={id}
                sessionId={sessionId}
                deviceId={deviceId}
                ahsPassword={ahsPassword}
              />
            ))}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}