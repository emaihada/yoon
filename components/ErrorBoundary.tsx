import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    let errorMsg = error.message;
    try {
      // Try to parse if it's a JSON string from handleFirestoreError
      const parsed = JSON.parse(error.message);
      if (parsed.error) {
        errorMsg = `Firebase Error: ${parsed.error} (${parsed.operationType} at ${parsed.path})`;
      }
    } catch (e) {
      // Not a JSON string, use as is
    }
    return { hasError: true, errorInfo: errorMsg };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
            <h2 className="text-2xl font-bold text-red-600 mb-4">문제가 발생했습니다</h2>
            <p className="text-gray-600 mb-6">
              애플리케이션 실행 중 오류가 발생했습니다. 아래 내용을 확인해 주세요.
            </p>
            <div className="bg-red-50 p-4 rounded-xl mb-6 overflow-auto max-h-40">
              <code className="text-sm text-red-800 break-all">
                {this.state.errorInfo}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
