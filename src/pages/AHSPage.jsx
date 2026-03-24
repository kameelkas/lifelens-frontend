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
import { useParams, useNavigate } from "react-router-dom";
import { fetchVisual, fetchImageEncrypted, fetchAHSImage } from "../api/client";

// Render Fernet-encrypted bytes as pixel noise on a canvas
// Returns a data URL string
function encryptedBytesToNoiseUrl(arrayBuffer) {
  const raw  = new Uint8Array(arrayBuffer);
  const side = Math.max(64, Math.floor(Math.sqrt(raw.length / 3)));
  const canvas = document.createElement("canvas");
  canvas.width  = side;
  canvas.height = side;
  const ctx     = canvas.getContext("2d");
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
  const [noiseSrc,     setNoiseSrc]     = useState(null);
  const [decryptedSrc, setDecryptedSrc] = useState(null);
  const [decrypting,   setDecrypting]   = useState(false);
  const [error,        setError]        = useState("");

  // Load noise version on mount
  useEffect(() => {
    fetchImageEncrypted(sessionId, imageId, deviceId)
      .then((buffer) => setNoiseSrc(encryptedBytesToNoiseUrl(buffer)))
      .catch(() => setError("Failed to load image"));
  }, [imageId]);

  // Decrypt when ahsPassword is provided
  useEffect(() => {
    if (!ahsPassword) return;
    setDecrypting(true);
    setError("");
    fetchAHSImage(sessionId, imageId, deviceId, ahsPassword)
      .then((src) => setDecryptedSrc(src))
      .catch(() => setError("Decryption failed — check password"))
      .finally(() => setDecrypting(false));
  }, [ahsPassword]);

  const src = decryptedSrc || noiseSrc;

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      <div className="aspect-square bg-black flex items-center justify-center">
        {src
          ? <img src={src} alt={imageId} className="w-full h-full object-cover" />
          : <p className="text-brand-gray text-xs">Loading...</p>
        }
      </div>
      <div className="p-2">
        <p className="text-brand-gray text-xs truncate">{imageId}</p>
        {decrypting && <p className="text-brand-gold text-xs mt-1">Decrypting...</p>}
        {error      && <p className="text-red-400 text-xs mt-1">{error}</p>}
        {decryptedSrc && !error && (
          <p className="text-green-400 text-xs mt-1">Decrypted</p>
        )}
      </div>
    </div>
  );
}

export default function AHSPage() {
  const { sessionId }             = useParams();
  // device_id is embedded in session_id: session_{date}_{time}_{device_id}
  const deviceId = sessionId.split("_").slice(3).join("_");
  const navigate                  = useNavigate();

  const [imageIds,     setImageIds]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [password,     setPassword]     = useState("");
  const [ahsPassword,  setAhsPassword]  = useState(""); // only set on submit

  // Load visual_output.json to get all image_ids for this session
  useEffect(() => {
    fetchVisual(sessionId, deviceId)
      .then((visual) => {
        const ids = new Set();
        Object.values(visual).forEach((part) => {
          Object.values(part.injuries ?? {}).forEach((inj) => {
            if (inj.image_id) ids.add(inj.image_id);
          });
        });
        setImageIds([...ids]);
      })
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
    <div className="min-h-screen bg-brand-navy text-white">

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-brand-gray text-sm hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-brand-gold text-xl font-semibold">AHS Portal</h1>
        </div>
        <p className="text-brand-gray text-xs">{sessionId}</p>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10">

        {/* Password gate */}
        <div className="mb-8 bg-white/5 border border-white/10 rounded-lg px-6 py-5">
          <p className="text-white/60 text-sm mb-4">
            Images are shown anonymized by default. Enter the AHS password to decrypt.
          </p>

          {ahsPassword ? (
            <div className="flex items-center gap-4">
              <p className="text-green-400 text-sm">Images decrypted</p>
              <button
                onClick={handleLock}
                className="text-brand-gray text-sm hover:text-white transition-colors"
              >
                Lock
              </button>
            </div>
          ) : (
            <form onSubmit={handleDecrypt} className="flex items-center gap-3">
              <input
                type="password"
                placeholder="AHS password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/10 text-white placeholder-brand-gray border border-white/10
                           rounded px-4 py-2 text-sm focus:outline-none focus:border-brand-gold"
              />
              <button
                type="submit"
                className="bg-brand-gold text-brand-navy font-semibold rounded px-4 py-2
                           text-sm hover:opacity-90 transition-opacity"
              >
                Decrypt all
              </button>
            </form>
          )}
        </div>

        {/* Image grid */}
        {loading && <p className="text-brand-gray text-sm">Loading...</p>}
        {error   && <p className="text-red-400 text-sm">{error}</p>}

        {!loading && !error && imageIds.length === 0 && (
          <p className="text-brand-gray text-sm">No images found for this session.</p>
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
    </div>
  );
}