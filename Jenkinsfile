pipeline {
    agent any

    environment {
        DOCKER_HUB = "sujitht007"
        IMAGE_NAME = "microservice-app"
        KUBECONFIG = "C:\\Users\\LENOVO\\.kube\\config"  // <-- points to your Minikube kubeconfig
    }

    stages {

        stage('Build') {
            steps {
                bat 'npm install'
            }
        }

        stage('Test') {
            steps {
                bat 'echo No tests yet'
            }
        }

        stage('Docker Build') {
            steps {
                bat "docker build -t %DOCKER_HUB%/%IMAGE_NAME%:latest ."
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-pass', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    bat """
                    echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                    docker push %DOCKER_HUB%/%IMAGE_NAME%:latest
                    """
                }
            }
        }

        stage('Kubernetes Deploy') {
            steps {
                // Ensure Jenkins knows where kubeconfig is
                withEnv(["KUBECONFIG=${env.KUBECONFIG}"]) {
                    // Optional: skip YAML validation to avoid openapi errors
                    bat 'kubectl apply -f k8s\\ --validate=false'
                }
            }
        }
    }
}
