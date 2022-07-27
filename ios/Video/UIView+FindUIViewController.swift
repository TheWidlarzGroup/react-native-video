//  Source: http://stackoverflow.com/a/3732812/1123156

extension UIView {
    func firstAvailableUIViewController() -> UIViewController? {
        // convenience function for casting and to "mask" the recursive function
        return traverseResponderChainForUIViewController()
    }

    func traverseResponderChainForUIViewController() -> UIViewController? {
        if let nextUIViewController = next as? UIViewController {
            return nextUIViewController
        } else if let nextUIView = next as? UIView {
            return nextUIView.traverseResponderChainForUIViewController()
        } else {
            return nil
        }
    }
}
