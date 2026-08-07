package installer

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestInstallScriptPrintsCopyPasteablePathInstructions(t *testing.T) {
	tempDir := t.TempDir()
	fakeBinDir := filepath.Join(tempDir, "fake-bin")
	installDir := filepath.Join(tempDir, "local bin")
	recordPath := filepath.Join(tempDir, "data", "install.json")
	if err := os.MkdirAll(fakeBinDir, 0o755); err != nil {
		t.Fatal(err)
	}

	fakeGo := `#!/bin/sh
set -eu
output=
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-o" ]; then
    shift
    output=$1
  fi
  shift
done
printf '#!/bin/sh\nprintf "thalweg test-version\\n"\n' >"$output"
chmod 0755 "$output"
`
	if err := os.WriteFile(filepath.Join(fakeBinDir, "go"), []byte(fakeGo), 0o755); err != nil {
		t.Fatal(err)
	}

	command := exec.Command("/bin/sh", filepath.Join("..", "..", "scripts", "install.sh"))
	command.Env = append(os.Environ(),
		"HOME="+tempDir,
		"PATH="+fakeBinDir+":/usr/bin:/bin",
		"THALWEG_INSTALL_DIR="+installDir,
		"THALWEG_INSTALL_RECORD_PATH="+recordPath,
	)
	output, err := command.CombinedOutput()
	if err != nil {
		t.Fatalf("install script failed: %v\n%s", err, output)
	}

	text := string(output)
	expected := []string{
		"Installed Thalweg.",
		"Binary: " + installDir + "/thalweg",
		"The install directory is not currently in PATH.",
		"export PATH='" + installDir + "':$PATH",
		"~/.zshrc or ~/.bashrc",
		"thalweg init",
	}
	for _, fragment := range expected {
		if !strings.Contains(text, fragment) {
			t.Errorf("output does not contain %q:\n%s", fragment, text)
		}
	}
}

func TestInstallScriptSkipsPathInstructionsWhenAlreadyConfigured(t *testing.T) {
	tempDir := t.TempDir()
	fakeBinDir := filepath.Join(tempDir, "fake-bin")
	installDir := filepath.Join(tempDir, "bin")
	recordPath := filepath.Join(tempDir, "data", "install.json")
	if err := os.MkdirAll(fakeBinDir, 0o755); err != nil {
		t.Fatal(err)
	}

	fakeGo := `#!/bin/sh
set -eu
output=
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-o" ]; then
    shift
    output=$1
  fi
  shift
done
printf '#!/bin/sh\nprintf "thalweg test-version\\n"\n' >"$output"
chmod 0755 "$output"
`
	if err := os.WriteFile(filepath.Join(fakeBinDir, "go"), []byte(fakeGo), 0o755); err != nil {
		t.Fatal(err)
	}

	command := exec.Command("/bin/sh", filepath.Join("..", "..", "scripts", "install.sh"))
	command.Env = append(os.Environ(),
		"HOME="+tempDir,
		"PATH="+fakeBinDir+":"+installDir+":/usr/bin:/bin",
		"THALWEG_INSTALL_DIR="+installDir,
		"THALWEG_INSTALL_RECORD_PATH="+recordPath,
	)
	output, err := command.CombinedOutput()
	if err != nil {
		t.Fatalf("install script failed: %v\n%s", err, output)
	}

	text := string(output)
	if strings.Contains(text, "export PATH=") {
		t.Fatalf("output unexpectedly contains PATH instructions:\n%s", text)
	}
	if !strings.Contains(text, "Next, initialize this device:") ||
		!strings.Contains(text, "thalweg init") {
		t.Fatalf("output does not contain the initialization next step:\n%s", text)
	}
}

func TestInstallScriptReportsExistingVersionUpdateAndConfiguration(t *testing.T) {
	tempDir := t.TempDir()
	fakeBinDir := filepath.Join(tempDir, "fake-bin")
	installDir := filepath.Join(tempDir, "bin")
	recordPath := filepath.Join(tempDir, "data", "install.json")
	configPath := filepath.Join(tempDir, "config", "config.json")
	if err := os.MkdirAll(fakeBinDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(installDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Dir(configPath), 0o755); err != nil {
		t.Fatal(err)
	}

	existingBinary := "#!/bin/sh\nprintf 'thalweg old-version\\n'\n"
	if err := os.WriteFile(
		filepath.Join(installDir, "thalweg"),
		[]byte(existingBinary),
		0o755,
	); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(configPath, []byte("{}\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	fakeGo := `#!/bin/sh
set -eu
output=
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-o" ]; then
    shift
    output=$1
  fi
  shift
done
printf '#!/bin/sh\nprintf "thalweg new-version\\n"\n' >"$output"
chmod 0755 "$output"
`
	if err := os.WriteFile(filepath.Join(fakeBinDir, "go"), []byte(fakeGo), 0o755); err != nil {
		t.Fatal(err)
	}

	command := exec.Command("/bin/sh", filepath.Join("..", "..", "scripts", "install.sh"))
	command.Env = append(os.Environ(),
		"HOME="+tempDir,
		"PATH="+fakeBinDir+":"+installDir+":/usr/bin:/bin",
		"THALWEG_INSTALL_DIR="+installDir,
		"THALWEG_INSTALL_RECORD_PATH="+recordPath,
		"THALWEG_CONFIG_PATH="+configPath,
	)
	output, err := command.CombinedOutput()
	if err != nil {
		t.Fatalf("install script failed: %v\n%s", err, output)
	}

	text := string(output)
	expected := []string{
		"Updated Thalweg.",
		"Previous version: thalweg old-version",
		"Installed version: thalweg new-version",
		"Kept the existing device configuration:",
		configPath,
		"thalweg daemon restart",
	}
	for _, fragment := range expected {
		if !strings.Contains(text, fragment) {
			t.Errorf("output does not contain %q:\n%s", fragment, text)
		}
	}
	if strings.Contains(text, "thalweg init") {
		t.Errorf("output unexpectedly suggests initialization:\n%s", text)
	}
}

func TestInstallScriptReportsSameVersionReinstall(t *testing.T) {
	tempDir := t.TempDir()
	fakeBinDir := filepath.Join(tempDir, "fake-bin")
	installDir := filepath.Join(tempDir, "bin")
	recordPath := filepath.Join(tempDir, "data", "install.json")
	if err := os.MkdirAll(fakeBinDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(installDir, 0o755); err != nil {
		t.Fatal(err)
	}

	binary := "#!/bin/sh\nprintf 'thalweg same-version\\n'\n"
	if err := os.WriteFile(filepath.Join(installDir, "thalweg"), []byte(binary), 0o755); err != nil {
		t.Fatal(err)
	}
	fakeGo := `#!/bin/sh
set -eu
output=
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-o" ]; then
    shift
    output=$1
  fi
  shift
done
printf '#!/bin/sh\nprintf "thalweg same-version\\n"\n' >"$output"
chmod 0755 "$output"
`
	if err := os.WriteFile(filepath.Join(fakeBinDir, "go"), []byte(fakeGo), 0o755); err != nil {
		t.Fatal(err)
	}

	command := exec.Command("/bin/sh", filepath.Join("..", "..", "scripts", "install.sh"))
	command.Env = append(os.Environ(),
		"HOME="+tempDir,
		"PATH="+fakeBinDir+":"+installDir+":/usr/bin:/bin",
		"THALWEG_INSTALL_DIR="+installDir,
		"THALWEG_INSTALL_RECORD_PATH="+recordPath,
	)
	output, err := command.CombinedOutput()
	if err != nil {
		t.Fatalf("install script failed: %v\n%s", err, output)
	}

	text := string(output)
	if !strings.Contains(text, "Reinstalled Thalweg.") ||
		!strings.Contains(text, "Version: thalweg same-version") {
		t.Fatalf("output does not report a same-version reinstall:\n%s", text)
	}
}
