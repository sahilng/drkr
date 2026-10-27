import Cocoa
import SafariServices
import WebKit

let extensionBundleIdentifier = (Bundle.main.bundleIdentifier ?? "io.github.sahilng.drkr") + ".Extension"

class ViewController: NSViewController, WKNavigationDelegate, WKScriptMessageHandler {
    @IBOutlet var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()
        webView.navigationDelegate = self
        webView.configuration.userContentController.add(self, name: "controller")
        guard let page = Bundle.main.url(forResource: "Main", withExtension: "html"),
              let resources = Bundle.main.resourceURL else { return }
        webView.loadFileURL(page, allowingReadAccessTo: resources)
    }

    private func showError(_ message: String) {
        guard let encoded = try? JSONEncoder().encode(message),
              let literal = String(data: encoded, encoding: .utf8) else { return }
        webView.evaluateJavaScript("showError(\(literal))")
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { [weak self] state, error in
            DispatchQueue.main.async {
                guard let self = self else { return }
                if let state = state, error == nil {
                    self.webView.evaluateJavaScript("show(\(state.isEnabled))")
                } else {
                    self.showError("Safari hasn’t reported this packaged extension’s state. Open Safari Extensions Settings to enable it. A temporary copy is listed separately.")
                }
            }
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        // Keep the bundled setup UI offline. Open support/source links in the
        // user's browser only after an explicit link activation.
        if navigationAction.navigationType == .linkActivated,
           let url = navigationAction.request.url, url.scheme == "https" {
            let supportHost = ["drkr.space", "www.drkr.space"].contains(url.host ?? "")
            let legacySupport = url.host == "sahilng.github.io" && url.path.hasPrefix("/drkr/")
            let source = url.host == "github.com" && (url.path == "/sahilng/drkr" || url.path.hasPrefix("/sahilng/drkr/"))
            if supportHost || legacySupport || source {
                NSWorkspace.shared.open(url)
                decisionHandler(.cancel)
                return
            }
        }
        guard navigationAction.request.url?.isFileURL == true else {
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame,
              let body = message.body as? String, body == "open-preferences" else { return }
        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { [weak self] error in
            if let error = error {
                DispatchQueue.main.async { self?.showError("Couldn’t open Safari Settings: \(error.localizedDescription)") }
            }
        }
    }
}
