<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Controller;
use App\Models\AccessLog;
use App\Models\PracticeSession;

class SessionController extends Controller
{
    public function store(array $p): void
    {
        $u = Auth::requireAuth();
        $in = $this->input();

        $details = null;
        if (!empty($in['details']) && is_array($in['details'])) {
            $details = json_encode($in['details'], JSON_UNESCAPED_UNICODE);
        }

        $id = PracticeSession::create([
            'user_id'       => (int) $u['id'],
            'hymn_id'       => !empty($in['hymn_id']) ? (int) $in['hymn_id'] : null,
            'voice_type'    => $in['voice_type'] ?? $u['voice_type'],
            'duration_sec'  => (int) round((float) ($in['duration_sec'] ?? 0)),
            'accuracy_pct'  => (float) ($in['accuracy_pct'] ?? 0),
            'avg_cents_off' => (float) ($in['avg_cents_off'] ?? 0),
            'median_freq'   => isset($in['median_freq']) ? (float) $in['median_freq'] : null,
            'low_freq'      => isset($in['low_freq']) ? (float) $in['low_freq'] : null,
            'high_freq'     => isset($in['high_freq']) ? (float) $in['high_freq'] : null,
            'details'       => $details,
        ]);
        AccessLog::log((int) $u['id'], 'practice');
        $this->json(['id' => $id], 201);
    }

    public function mine(array $p): void
    {
        $u = Auth::requireAuth();
        $this->json(['sessions' => PracticeSession::mine((int) $u['id'])]);
    }
}
