#!/bin/bash
# Pre-push hook: runs opencode security reviewer agent on staged changes.
# Installed via: ln -sf ../../scripts/pre-push-security-review.sh .git/hooks/pre-push

echo "--- Security Review ---"
echo "Running opencode security-reviewer agent..."

OPENCODE_BIN="${OPENCODE_BIN:-opencode}"

# Collect the diff being pushed
GIT_DIFF=$(git diff --cached --stat --diff-algorithm=histogram 2>/dev/null || true)

if [ -z "$GIT_DIFF" ]; then
  # If no staged changes, diff against the remote ref being pushed to
  while read local_ref local_sha remote_ref remote_sha; do
    if [ "$local_sha" != "0000000000000000000000000000000000000000" ]; then
      GIT_DIFF=$(git diff "$remote_sha..$local_sha" --stat --diff-algorithm=histogram 2>/dev/null || true)
    fi
  done
fi

echo "Changes detected:"
echo "$GIT_DIFF"

"$OPENCODE_BIN" run \
  --agent security-reviewer \
  "Review the staged changes for security vulnerabilities. Here's the diff stats:
$GIT_DIFF"

EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "--- Security Review FAILED (exit $EXIT_CODE) ---"
  exit $EXIT_CODE
fi

echo "--- Security Review PASSED ---"
exit 0
